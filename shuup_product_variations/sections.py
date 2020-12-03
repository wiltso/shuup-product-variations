# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.utils.translation import ugettext as _
from shuup.admin.base import Section
from shuup.admin.shop_provider import get_shop
from shuup.core.models import Currency, ProductMode, Supplier


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

        supplier_count = Supplier.objects.filter(
            shop_products__shop=shop,
            shop_products__product=product
        ).count()
        if supplier_count != 1:
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
        shop_product = main_product.get_shop_instance(shop)
        currency = Currency.objects.filter(code=shop.currency).first()
        return {
            "product_id": main_product.pk,
            "default_sku": main_product.sku,
            "default_price": shop_product.default_price_value,
            "currency": currency.code,
            "currency_decimal_places": currency.decimal_places,
            "can_create": True,
            "can_edit": True,
            "max_variations": 4
        }
