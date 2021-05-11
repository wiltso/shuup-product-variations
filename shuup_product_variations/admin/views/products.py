# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
import json

import six
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import F, OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.db.transaction import atomic
from django.http import JsonResponse
from django.utils.encoding import force_text
from django.utils.translation import activate, get_language, ugettext_lazy as _
from django.views.generic import DetailView
from shuup.admin.shop_provider import get_shop
from shuup.admin.supplier_provider import get_supplier
from shuup.core.models import Product, ShopProduct
from shuup.utils.djangoenv import has_installed

from shuup_product_variations.admin.views.serializers import (
    ProductCombinationsDeleteSerializer,
    ProductCombinationsSerializer,
)


class ProductCombinationsView(DetailView):
    model = Product

    def get_queryset(self):
        queryset = Product.objects.filter(shop_products__shop=get_shop(self.request))
        supplier = get_supplier(self.request)
        if supplier:
            queryset = queryset.filter(shop_products__suppliers=supplier)

        return queryset.distinct()

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        combinations_data = []
        product_data = []
        product_ids = set()
        old_language = get_language()
        activate(settings.PARLER_DEFAULT_LANGUAGE_CODE)

        shop = get_shop(request)
        shop_product = self.object.get_shop_instance(shop)
        supplier = get_supplier(request)
        if not supplier:
            supplier = shop_product.suppliers.first()

        if not supplier:
            return JsonResponse({"combinations": [], "product_data": []})

        for combination in self.object.get_all_available_combinations():
            product_id = combination["result_product_pk"]
            if not product_id:
                continue

            product_ids.add(product_id)
            combinations_data.append(
                {
                    "product": product_id,
                    "sku_part": combination["sku_part"],
                    "hash": combination["hash"],
                    "combination": {
                        force_text(k): force_text(v) for k, v in six.iteritems(combination["variable_to_value"])
                    },
                }
            )

        is_simple_supplier_installed = has_installed("shuup.simple_supplier")

        stock_managed = bool(
            is_simple_supplier_installed and supplier.module_identifier == "simple_supplier" and supplier.stock_managed
        )

        is_multivendor_installed = has_installed("shuup_multivendor")

        base_queryset = ShopProduct.objects.filter(shop=shop, product_id__in=product_ids)
        if stock_managed and is_multivendor_installed:
            from shuup.simple_supplier.models import StockCount
            from shuup_multivendor.models import SupplierPrice

            product_data = base_queryset.annotate(
                sku=F("product__sku"),
                price=Coalesce(
                    Subquery(
                        SupplierPrice.objects.filter(
                            shop=shop, supplier=supplier, product_id=OuterRef("product_id")
                        ).values("amount_value")[:1]
                    ),
                    0,
                ),
                stock_count=Coalesce(
                    Subquery(StockCount.objects.filter(product_id=OuterRef("product_id")).values("logical_count")[:1]),
                    0,
                ),
            ).values("pk", "product_id", "sku", "price", "stock_count")
        elif stock_managed:
            from shuup.simple_supplier.models import StockCount

            product_data = base_queryset.annotate(
                sku=F("product__sku"),
                price=F("default_price_value"),
                stock_count=Coalesce(
                    Subquery(StockCount.objects.filter(product_id=OuterRef("product_id")).values("logical_count")[:1]),
                    0,
                ),
            ).values("pk", "product_id", "sku", "price", "stock_count")
        elif is_multivendor_installed:
            from shuup_multivendor.models import SupplierPrice

            product_data = base_queryset.annotate(
                sku=F("product__sku"),
                price=Coalesce(
                    Subquery(
                        SupplierPrice.objects.filter(
                            shop=shop, supplier=supplier, product_id=OuterRef("product_id")
                        ).values("amount_value")[:1]
                    ),
                    0,
                ),
            ).values("pk", "product_id", "sku", "price")
        else:
            product_data = base_queryset.annotate(
                sku=F("product__sku"),
                price=F("default_price_value"),
            ).values("pk", "product_id", "sku", "price")

        activate(old_language)
        return JsonResponse({"combinations": combinations_data, "product_data": list(product_data)})

    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return JsonResponse({"error": _("Product not found"), "code": "product-not-found"}, status=404)

        try:
            combinations = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({"error": _("Invalid content data"), "code": "invalid-content"}, status=400)

        # use atomic here since the serializer can create the variation variables and values
        with atomic():
            serializer = ProductCombinationsSerializer(
                data=dict(combinations=combinations),
                context=dict(product=instance, shop=get_shop(request), supplier=get_supplier(request)),
            )
            if not serializer.is_valid():
                return JsonResponse({"error": serializer.errors, "code": "validation-fail"}, status=400)

            try:
                old_language = get_language()
                activate(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                serializer.save()
                activate(old_language)
            except ValidationError as exc:
                return JsonResponse({"error": ", ".join(exc.messages), "code": exc.code}, status=400)

        return JsonResponse(serializer.validated_data)

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return JsonResponse({"error": _("Product not found"), "code": "product-not-found"}, status=404)

        try:
            combinations = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({"error": _("Invalid content data"), "code": "invalid-content"}, status=400)

        serializer = ProductCombinationsDeleteSerializer(
            data=dict(combinations=combinations),
            context=dict(product=instance, shop=get_shop(request), supplier=get_supplier(request)),
        )
        if not serializer.is_valid():
            return JsonResponse({"error": serializer.errors, "code": "validation-fail"}, status=400)

        try:
            old_language = get_language()
            activate(settings.PARLER_DEFAULT_LANGUAGE_CODE)
            serializer.save()
            activate(old_language)
        except ValidationError as exc:
            return JsonResponse({"error": ", ".join(exc.messages), "code": exc.code}, status=400)

        return JsonResponse({})
