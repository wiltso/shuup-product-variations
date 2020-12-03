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
                    raise serializers.ValidationError(_("Invalid variable '{var}'").format(var=variable_name))

                value = ProductVariationVariableValue.objects.filter(
                    variable=variable,
                    translations__value=variable_value
                ).first()

                if not value:
                    raise serializers.ValidationError(
                        _("Invalid value '{value}' for variable {var}").format(
                            value=variable_value,
                            var=variable_name
                        )
                    )
                combination_set[variable] = value

            combination_hash = hash_combination(combination_set)
            variation_result = ProductVariationResult.objects.filter(
                product=parent_product,
                combination_hash=combination_hash
            ).first()
            if not variation_result:
                raise serializers.ValidationError(_("Variation not found for the given combination."))

            variation_product = variation_result.result
        else:
            variation_product = Product.objects.filter(
                sku=sku,
                variation_parent=parent_product
            ).first()

            if not variation_product:
                raise serializers.ValidationError(_("Variation not found for the given SKU."))

        data["variation_product"] = variation_product
        return data


class ProductCombinationSerializer(serializers.Serializer):
    combination = serializers.DictField()
    sku = serializers.CharField()
    price = FormattedDecimalField(required=False)
    stock_count = serializers.IntegerField(required=False)

    def validate(self, data):
        data = super().validate(data)
        product = self.context["product"]
        combination_data = data["combination"]
        combination = dict()

        # convert combination string map to variation instance map
        for variable_name, variable_value in combination_data.items():
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

            combination[variable] = value

        data["combination"] = combination
        return data


class ProductCombinationsSerializer(serializers.Serializer):
    combinations = ProductCombinationSerializer(many=True)

    def save(self):
        parent_product = self.context["product"]
        shop = self.context["shop"]
        supplier = self.context["supplier"]
        variations = []
        variation_updater = cached_load("SHUUP_PRODUCT_VARIATIONS_VARIATION_UPDATER_SPEC")()

        with atomic():
            for combination in self.validated_data["combinations"]:
                variation_child, variation_child_shop_product = variation_updater.update_or_create_variation(
                    shop,
                    supplier,
                    parent_product,
                    combination
                )
                variations.append(variation_child)

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
                variation_updater.delete_variation(shop, supplier, parent_product, combination["variation_product"])
