# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.db.transaction import atomic
from django.utils.text import slugify
from django.utils.translation import ugettext_lazy as _
from parler.utils.context import switch_language
from rest_framework import serializers
from shuup.core.models import (
    Product, ProductVariationResult, ProductVariationVariable,
    ProductVariationVariableValue
)
from shuup.core.models._product_variation import hash_combination
from shuup.utils.importing import cached_load
from shuup_api.fields import FormattedDecimalField


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
        combination_instance = dict()

        # convert combination string map to variation instance map
        for variable_name, variable_value in combination.items():
            variable = ProductVariationVariable.objects.filter(
                product=product,
                translations__name=variable_name
            ).first()
            if not variable:
                variable = ProductVariationVariable.objects.create(
                    product=product,
                    name=variable_name,
                    identifier=slugify(variable_name)
                )

            value = ProductVariationVariableValue.objects.filter(
                variable=variable,
                translations__value=variable_value
            ).first()
            if not value:
                value = ProductVariationVariableValue.objects.create(
                    identifier=slugify(variable_value),
                    variable=variable,
                    value=variable_value
                )

            combination_instance[variable] = value
        return combination_instance

    def save(self):
        parent_product = self.context["product"]
        shop = self.context["shop"]
        supplier = self.context["supplier"]
        variations = []
        variation_updater = cached_load("SHUUP_PRODUCT_VARIATIONS_VARIATION_UPDATER_SPEC")()

        with atomic():
            for combination in self.validated_data["combinations"]:
                combination_data = combination.copy()
                combination_data["combination"] = self._get_combination_instances(combination["combination"])

                variation_child, variation_child_shop_product = variation_updater.update_or_create_variation(
                    shop,
                    supplier,
                    parent_product,
                    combination_data=combination_data
                )
                variations.append(variation_child)

                # populate the validated data with the product id
                combination["product_id"] = variation_child.pk

        return variations


class ProductCombinationsDeleteSerializer(serializers.Serializer):
    combinations = ProductCombinationDeleteSerializer(many=True)

    def save(self):
        parent_product = self.context["product"]
        shop = self.context["shop"]
        supplier = self.context["supplier"]

        with atomic():
            variation_updater = cached_load("SHUUP_PRODUCT_VARIATIONS_VARIATION_UPDATER_SPEC")()
            for combination in self.validated_data["combinations"]:
                if combination["variation_product"]:
                    variation_updater.delete_variation(shop, supplier, parent_product, combination["variation_product"])


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
            item.name = self.validated_data["name"]
        return item
