# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.conf import settings
from django.urls import reverse
from django.utils.translation import ugettext as _
from shuup.admin.base import Section
from shuup.admin.shop_provider import get_shop
from shuup.admin.supplier_provider import get_supplier
from shuup.admin.utils.permissions import has_permission
from shuup.core.models import Currency, ProductMode
from shuup.utils.djangoenv import has_installed


class ProductVariationsSection(Section):
    identifier = "product_variations"
    name = _("Product variations")
    icon = "fa-cubes"
    template = "shuup_product_variations/product_variations.jinja"
    extra_js = "shuup_product_variations/product_variations_js.jinja"
    order = 2

    @classmethod
    def visible_for_object(cls, product, request=None):
        if not product.pk:
            return False

        shop = get_shop(request)
        if not shop:
            return False

        shop_product = product.get_shop_instance(shop)
        supplier = get_supplier(request)
        if not supplier:
            supplier = shop_product.suppliers.first()

        if not supplier:
            return False

        if get_supplier(request) is None and shop_product.suppliers.count() != 1:
            return False

        return (
            product.mode in [
                ProductMode.VARIABLE_VARIATION_PARENT,
                ProductMode.VARIATION_CHILD,
                ProductMode.NORMAL
            ]
        )

    @classmethod
    def get_context_data(cls, product, request=None):
        main_product = (product.variation_parent if product.variation_parent else product)
        shop = get_shop(request)
        main_shop_product = main_product.get_shop_instance(shop)
        supplier = get_supplier(request)
        if not supplier:
            supplier = main_shop_product.suppliers.first()

        is_simple_supplier_installed = has_installed("shuup.simple_supplier")

        stock_managed = bool(
            is_simple_supplier_installed and
            supplier.module_identifier == "simple_supplier" and
            supplier.stock_managed
        )

        currency = Currency.objects.filter(code=shop.currency).first()

        if (
            get_supplier(request) and
            has_installed("shuup_multivendor") and
            settings.SHUUP_MULTIVENDOR_ENABLE_CUSTOM_PRODUCTS
        ):
            product_url = reverse(
                "shuup_admin:shuup_multivendor.products_edit",
                kwargs={"pk": 9999}
            ).replace("9999", "xxxx")
            main_product_url = reverse(
                "shuup_admin:shuup_multivendor.products_edit",
                kwargs={"pk": main_shop_product.pk}
            )
        else:
            product_url = reverse(
                "shuup_admin:shop_product.edit",
                kwargs={"pk": 9999}
            ).replace("9999", "xxxx")
            main_product_url = reverse(
                "shuup_admin:shop_product.edit",
                kwargs={"pk": main_shop_product.pk}
            )

        combinations_url = reverse(
            "shuup_admin:shuup_product_variations.product.combinations",
            kwargs={"pk": main_product.pk}
        )
        default_variations_url = reverse("shuup_admin:shuup_product_variations.variations.list")
        variations_url = reverse(
            "shuup_admin:shuup_product_variations.product.variations",
            kwargs={"pk": 9999}
        ).replace("9999", "xxxx")
        variable_url = reverse(
            "shuup_admin:shuup_product_variations.product.variations_variable",
            kwargs={"pk": 9999}
        ).replace("9999", "xxxx")
        variable_value_url = reverse(
            "shuup_admin:shuup_product_variations.product.variations_variable_value",
            kwargs={"pk": 9999}
        ).replace("9999", "xxxx")

        return {
            "current_product_id": product.pk,
            "product_id": main_product.pk,
            "product_url": main_product_url,
            "product_url_template": product_url,
            "default_sku": main_product.sku,
            "default_price": main_shop_product.default_price_value or 0,
            "currency": currency.code,
            "currency_decimal_places": currency.decimal_places,
            "sales_unit": product.sales_unit.symbol,
            "sales_unit_decimal_places": product.sales_unit.decimals,
            "can_create": has_permission(request.user, "shuup_product_variations_can_create_variations"),
            "can_edit": has_permission(request.user, "shuup_product_variations.can_edit_variations"),
            "max_variations": settings.SHUUP_PRODUCT_VARIATIONS_MAX_VARIABLES,
            "max_values": settings.SHUUP_PRODUCT_VARIATIONS_MAX_VARIABLE_VALUES,
            "stock_managed": stock_managed,
            "is_simple_supplier_installed": is_simple_supplier_installed,
            "combinations_url": combinations_url,
            "default_variations_url": default_variations_url,
            "variations_url": variations_url,
            "variable_url": variable_url,
            "variable_value_url": variable_value_url
        }
