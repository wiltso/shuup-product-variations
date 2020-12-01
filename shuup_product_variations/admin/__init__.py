# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.utils.translation import ugettext_lazy as _
from shuup.admin.base import AdminModule
from shuup.admin.utils.urls import admin_url


class ProductVariationsModule(AdminModule):
    name = _("Product Variations")

    def get_urls(self):
        return [
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/combinations/$",
                "shuup_product_variations.admin.products.ProductCombinationsView",
                name="shuup_product_variations.product_combinations"
            ),
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/product_variations/$",
                "shuup_product_variations.admin.products.ProductVariationsView",
                name="shuup_product_variations.product_variations"
            ),
            admin_url(
                r"^shuup_product_variations/variations/$",
                "shuup_product_variations.admin.variations.VariationsListView",
                name="shuup_product_variations.variations_list"
            )
        ]

    def get_menu_entries(self, request):
        return []
