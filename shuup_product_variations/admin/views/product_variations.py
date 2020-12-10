# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from collections import defaultdict

from django.conf import settings
from django.http import JsonResponse
from django.views.generic import DetailView
from shuup.admin.supplier_provider import get_supplier
from shuup.core.models import (
    Product, ProductVariationVariable, ProductVariationVariableValue
)

from .variations_base import VariationBaseDetailView


class ProductVariationsView(DetailView):
    model = Product

    def get_queryset(self):
        queryset = super(ProductVariationsView, self).get_queryset()
        supplier = get_supplier(self.request)
        if supplier:
            queryset = queryset.filter(shop_products__suppliers=supplier)
        return queryset

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        variables_id_to_data = {}
        values_data = defaultdict(list)
        for variable_id, variable_order, variable_name, value_id, value_order, value_name in (
            ProductVariationVariableValue.objects
                .language(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                .filter(
                    variable__product_id=self.object.id,
                    variable__translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
                    translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE
                )
                .values_list(
                    "variable_id",
                    "variable__ordering",
                    "variable__translations__name",
                    "pk",
                    "ordering",
                    "translations__value"
                ).distinct()
        ):
            variables_id_to_data[variable_id] = {"name": variable_name, "order": variable_order}
            values_data[variable_id].append({
                "id": value_id, "order": value_order, "name":  value_name
            })

        return JsonResponse({
            "variables": variables_id_to_data,
            "values": values_data
        })


class ProductVariationVariableDetailView(VariationBaseDetailView):
    model = ProductVariationVariable

    def get_queryset(self):
        queryset = super(ProductVariationVariableDetailView, self).get_queryset()
        supplier = get_supplier(self.request)
        if supplier:
            queryset = queryset.filter(product__shop_products__suppliers=supplier)
        return queryset


class ProductVariationVariableValueDetailView(VariationBaseDetailView):
    model = ProductVariationVariableValue

    def get_queryset(self):
        queryset = super(ProductVariationVariableValueDetailView, self).get_queryset()
        supplier = get_supplier(self.request)
        if supplier:
            queryset = queryset.filter(variable__product__shop_products__suppliers=supplier)
        return queryset
