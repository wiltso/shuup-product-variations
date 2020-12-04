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
from django.db.models import F, OuterRef, Subquery
from django.db.transaction import atomic
from django.http import JsonResponse
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _
from django.views.generic import DetailView
from parler.utils.context import switch_language
from shuup.admin.shop_provider import get_shop
from shuup.admin.supplier_provider import get_supplier
from shuup.core.models import (
    Product, ProductVariationVariable,
    ProductVariationVariableValue, ShopProduct
)
from shuup.utils.djangoenv import has_installed
from shuup_product_variations.admin.views.serializers import (
    OrderingSerializer, ProductCombinationsDeleteSerializer,
    ProductCombinationsSerializer, TranslationSerializer
)


class ProductVariationsView(DetailView):
    model = Product

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        variables_id_to_name = {}
        values_data = defaultdict(list)

        for variable_id, variable_order, variable_name, value_id, value_order, value_name in (
            ProductVariationVariableValue.objects
                .language(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                .filter(variable__product_id=self.object.id)
                .values_list(
                    "variable_id",
                    "variable__ordering",
                    "variable__translations__name",
                    "pk",
                    "ordering",
                    "translations__value"
                )
        ):
            variables_id_to_name[variable_id] = {"name": variable_name, "order": variable_order}
            values_data[variable_id].append({
                "id": value_id, "order": value_order, "name":  value_name
            })

        return JsonResponse({
            "variables": variables_id_to_name,
            "values": values_data
        })


class ProductVariationBaseDetailView(DetailView):
    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return JsonResponse({
                "error": _("Variable not found"),
                "code": "product-not-found"
            }, status=404)

        try:
            data = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({
                "error": _("Invalid content data"),
                "code": "invalid-content"
            }, status=400)

        serializer = OrderingSerializer(
            data=data,
            context=dict(item=instance)
        )
        if not serializer.is_valid():
            serializer = TranslationSerializer(
                data=data,
                context=dict(item=instance)
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


    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        data = {}
        for language_code, language_name in settings.LANGUAGES:
            with switch_language(self.object, language_code):
                data[language_code] = {
                    "language_name": language_name,
                    "name": self.object.name
                }
        return JsonResponse(data)


class ProductVariationVariableDetailView(ProductVariationBaseDetailView):
    model = ProductVariationVariable


class ProductVariationVariableValueDetailView(ProductVariationBaseDetailView):
    model = ProductVariationVariableValue
