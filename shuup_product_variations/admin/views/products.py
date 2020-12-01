# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
import json
from collections import defaultdict

import six
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import OuterRef, Subquery
from django.http import JsonResponse
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _
from django.views.generic import DetailView
from shuup.admin.shop_provider import get_shop
from shuup.core.models import (
    Product, ProductVariationVariableValue, ShopProduct
)
from shuup.utils.djangoenv import has_installed
from shuup_product_variations.admin.views.serializers import (
    ProductCombinationsSerializer
)


class ProductCombinationsView(DetailView):
    model = Product

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        combinations_data = []
        product_data = []
        product_ids = set()

        for combination in self.object.get_all_available_combinations():
            product_id = combination["result_product_pk"]
            product_ids.add(product_id)
            combinations_data.append({
                "product": product_id,
                "sku_part": combination["sku_part"],
                "hash": combination["hash"],
                "combination": {
                    force_text(k): force_text(v)
                    for k, v in six.iteritems(combination["variable_to_value"])
                }
            })

        shop_product = self.object.get_shop_instance(get_shop(request))

        if has_installed("shuup.simple_supplier") and shop_product.suppliers.count() == 1:
            from shuup.simple_supplier.models import StockCount
            product_data = ShopProduct.objects.filter(
                product_id__in=product_ids
            ).annotate(
                stock_count=Subquery(
                    StockCount.objects.filter(product_id=OuterRef("product_id")).values("logical_count")[:1]
                )
            ).values("pk", "product_id", "product__sku", "default_price_value", "stock_count")
        else:
            product_data = ShopProduct.objects.filter(
                product_id__in=product_ids
            ).values("pk", "product_id", "product__sku", "default_price_value")

        return JsonResponse({
            "combinations": combinations_data,
            "product_data": list(product_data)
        })

    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return JsonResponse({
                "error": _("Product not found"),
                "code": "product-not-found"
            }, status=404)

        try:
            combinations = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({
                "error": _("Invalid content data"),
                "code": "invalid-content"
            }, status=400)

        serializer = ProductCombinationsSerializer(
            data=dict(combinations=combinations),
            context=dict(
                product=instance,
                shop=get_shop(request)
            )
        )
        if not serializer.is_valid():
            return JsonResponse({
                "error": serializer.errors,
                "code": "validation-fail"
            }, status=400)

        try:
            serializer.save()
        except ValidationError as exc:
            return JsonResponse({
                "error": exc.message,
                "code": exc.code
            }, status=400)

        return JsonResponse({})


class ProductVariationsView(DetailView):
    model = Product

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        variables_id_to_name = {}
        values_data = defaultdict(list)

        for variable_id, variable_name, variable_order, value_id, value_order, value_name in (
            ProductVariationVariableValue.objects
                .language(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                .filter(variable__product_id=self.object.id)
                .values_list(
                    "pk",
                    "ordering",
                    "variable_id",
                    "variable__ordering",
                    "translations__value",
                    "variable__translations__name"
                )
        ):
            variables_id_to_name[variable_id] = {"name": variable_order, "order": variable_name}
            values_data[variable_id].append({
                "id": value_id, "order": value_order, "name":  value_name
            })

        return JsonResponse({
            "variables": variables_id_to_name,
            "values": values_data
        })
