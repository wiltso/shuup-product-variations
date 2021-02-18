# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.conf import settings
from django.db.transaction import atomic
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _
from parler.utils.context import switch_language
from rest_framework import serializers
from shuup.core.models import (
    Product, ProductVariationLinkStatus, ProductVariationResult,
    ProductVariationVariable, ProductVariationVariableValue, ShopProduct
)
from shuup.core.models._product_variation import hash_combination
from shuup.utils.importing import cached_load
from shuup_api.fields import FormattedDecimalField
from shuup_product_variations.models import (
    VariationVariable, VariationVariableValue
)


class ProductCombinationDeleteSerializer(serializers.Serializer):
    combination = serializers.DictField(required=False)
    sku = serializers.CharField(required=False)

    def validate(self, data):
        parent_product = self.context["product"]
        variation_product = None
        combination = data.get("combination")
        sku = data.get("sku")

        if not sku and not combination:
            raise serializers.ValidationError(_("Either combination or SKU must be informed."))

        if combination:
            combination_set = dict()

            for variable_name, variable_value in combination.items():
                variable = ProductVariationVariable.objects.filter(
                    product=parent_product,
                    translations__name=variable_name
                ).first()

                if not variable:
                    continue

                value = ProductVariationVariableValue.objects.filter(
                    variable=variable,
                    translations__value=variable_value
                ).first()

                if not value:
                    continue

                combination_set[variable] = value

            combination_hash = hash_combination(combination_set)
            variation_result = ProductVariationResult.objects.filter(
                product=parent_product,
                combination_hash=combination_hash
            ).first()

            variation_product = variation_result.result if variation_result else None
        else:
            variation_product = Product.objects.filter(
                sku=sku,
                variation_parent=parent_product
            ).first()

        data["variation_product"] = variation_product
        return data


class ProductCombinationSerializer(serializers.Serializer):
    combination = serializers.DictField()
    sku = serializers.CharField()
    price = FormattedDecimalField(required=False)
    stock_count = serializers.IntegerField(required=False)


class ProductCombinationsSerializer(serializers.Serializer):
    combinations = ProductCombinationSerializer(many=True)

    def _get_combination_instances(self, combination):
        """
        Convert the combination map of strings into map of instances
        """
        product = self.context["product"]
        combination_pks = dict()
        combination_names = dict()
        # convert combination string map to variation instance map
        for variable_name, variable_value in combination.items():
            variable = ProductVariationVariable.objects.filter(
                product=product,
                translations__name=variable_name
            ).values_list("pk", flat=True).first()
            if not variable:
                variable = ProductVariationVariable.objects.create(
                    product=product,
                    name=variable_name,
                    identifier=slugify(variable_name)
                ).pk

            value = ProductVariationVariableValue.objects.filter(
                variable=variable,
                translations__value=variable_value
            ).values_list("pk", flat=True).first()
            if not value:
                value = ProductVariationVariableValue.objects.create(
                    identifier=slugify(variable_value),
                    variable_id=variable,
                    value=variable_value
                ).pk

            combination_pks[variable] = value
            combination_names[variable_name] = variable_value
        return dict(
            combination_pks=combination_pks,
            combination_names=combination_names
        )

    def save(self):
        parent_product = self.context["product"]
        shop = self.context["shop"]
        supplier = self.context["supplier"]
        variations = []
        variation_shop_products = []
        variation_updater = cached_load("SHUUP_PRODUCT_VARIATIONS_VARIATION_UPDATER_SPEC")()
        with atomic():
            parent_shop_product = parent_product.get_shop_instance(shop)
            # when there is no current supplier set, use the single supplier configured for the product, if any
            if not supplier and parent_shop_product.suppliers.count() == 1:
                supplier = parent_shop_product.suppliers.first()

            for combination in self.validated_data["combinations"]:
                combination_data = combination.copy()
                combination_data["combination_data"] = self._get_combination_instances(combination["combination"])
                variation_child, variation_child_shop_product = variation_updater.update_or_create_variation(
                    shop,
                    supplier,
                    parent_shop_product,
                    combination_data=combination_data
                )
                variations.append(variation_child)
                variation_shop_products.append(variation_child_shop_product)
                # populate the validated data with the product id
                combination["product_id"] = variation_child.pk

            # Just one supplier limitation. For multiple suppliers we should look into
            # adding shop product supplier strategy to fallback
            for parent_supplier in parent_shop_product.suppliers.all():
                parent_supplier.shop_products.add(*variation_shop_products)

        cheapest_child = ShopProduct.objects.filter(
            product__variation_parent_id=parent_product.pk
        ).order_by("default_price_value").first()
        parent_shop_product.default_price_value = cheapest_child.default_price_value
        parent_shop_product.save()

        return variations


class ProductCombinationsDeleteSerializer(serializers.Serializer):
    combinations = ProductCombinationDeleteSerializer(many=True)

    def save(self):
        parent_product = self.context["product"]
        shop = self.context["shop"]
        supplier = self.context["supplier"]

        with atomic():
            variation_updater = cached_load("SHUUP_PRODUCT_VARIATIONS_VARIATION_UPDATER_SPEC")()
            hash_to_variable_value = dict()

            for combination in parent_product.get_all_available_combinations():
                hash_to_variable_value[combination["hash"]] = combination["variable_to_value"]

            for combination in self.validated_data["combinations"]:
                if combination["variation_product"]:
                    variation_updater.delete_variation(
                        shop,
                        supplier,
                        parent_product,
                        combination["variation_product"],
                    )

            # discover which variables and values are being used
            visible_combinations_hashes = ProductVariationResult.objects.filter(
                product=parent_product,
                status=ProductVariationLinkStatus.VISIBLE
            ).values_list("combination_hash", flat=True)
            used_variables_ids = set()
            used_values_ids = set()

            for used_hash in visible_combinations_hashes:
                for variable, value in hash_to_variable_value.get(used_hash, {}).items():
                    used_variables_ids.add(variable.pk)
                    used_values_ids.add(value.pk)

            # delete all variables and values not being used
            ProductVariationVariableValue.objects.filter(
                variable__product=parent_product
            ).exclude(pk__in=used_values_ids).delete()
            ProductVariationVariable.objects.filter(
                product=parent_product
            ).exclude(pk__in=used_variables_ids).delete()
            parent_product.verify_mode()
            parent_product.save()


class OrderingSerializer(serializers.Serializer):
    ordering = serializers.IntegerField()

    def save(self):
        item = self.context["item"]
        item.ordering = self.validated_data["ordering"]
        item.save()
        return item


class TranslationSerializer(serializers.Serializer):
    language_code = serializers.CharField()
    name = serializers.CharField()

    def save(self):
        item = self.context["item"]
        with switch_language(item, self.validated_data["language_code"]):
            if hasattr(item, "name"):
                item.name = self.validated_data["name"]
            else:
                item.value = self.validated_data["name"]
            item.save()
        return item


class VariableVariableSerializer(serializers.Serializer):
    name = serializers.CharField()
    values = serializers.ListField(child=serializers.CharField())

    def save(self):
        name = self.validated_data["name"]
        variable = VariationVariable.objects.filter(
            translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
            translations__name=name
        ).first()
        if not variable:
            variable = VariationVariable.objects.create(
                identifier=slugify(name), name=name,
            )

        seen_value_ids = set()
        for value in self.validated_data["values"]:
            variable_value = VariationVariableValue.objects.filter(
                variable_id=variable.pk,
                translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
                translations__value=value
            ).first()
            if not variable_value:
                variable_value = VariationVariableValue.objects.create(
                    identifier=slugify(value), variable_id=variable.pk, value=value,
                )
            seen_value_ids.add(variable_value.pk)

        # Delete unseeen values
        VariationVariableValue.objects.filter(
            variable_id=variable.pk
        ).exclude(pk__in=seen_value_ids).delete()

        return {
            "id": variable.pk,
            "name": variable.name,
            "values": self.validated_data["values"]
        }


class VariableVariableDeleteSerializer(serializers.Serializer):
    name = serializers.CharField()

    def save(self):
        name = self.validated_data["name"]
        variable = VariationVariable.objects.filter(
            translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
            translations__name=name
        ).first()
        if not variable:
            variable = VariationVariable.objects.create(
                identifier=slugify(name), name=name,
            )
        variable.delete()

        return self.validated_data
