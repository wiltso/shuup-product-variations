# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.db.transaction import atomic
from django.utils.text import slugify
from rest_framework import serializers
from shuup.core.models import (
    ProductVariationVariable, ProductVariationVariableValue
)
from shuup.utils.importing import cached_load
from shuup_api.fields import FormattedDecimalField


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

            variable_value = ProductVariationVariableValue.objects.filter(
                variable=variable,
                translations__value=variable_value
            ).first()
            if not variable_value:
                variable_value = ProductVariationVariableValue.objects.create(
                    identifier=slugify(variable_value),
                    variable=variable,
                    value=variable_value
                )

            combination[variable] = variable_value

        data["combination"] = combination
        return data


class ProductCombinationsSerializer(serializers.Serializer):
    combinations = ProductCombinationSerializer(many=True)

    def save(self):
        parent_product = self.context["product"]
        shop = self.context["shop"]
        variations = []
        variation_updater = cached_load("SHUUP_PRODUCT_VARIATIONS_VARIATION_UPDATER_SPEC")

        with atomic():
            for combination in self.validated_data["combinations"]:
                variation_child, variation_child_shop_product = variation_updater(shop, parent_product, combination)
                variations.append(variation_child)

        return variations
