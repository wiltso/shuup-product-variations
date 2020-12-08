# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.utils.translation import ugettext_lazy as _
from shuup.admin.base import AdminModule, MenuEntry
from shuup.admin.menu import SETTINGS_MENU_CATEGORY
from shuup.admin.utils.urls import admin_url


class ProductVariationsModule(AdminModule):
    name = _("Product Variations")

    def get_urls(self):
        return [
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/combinations/$",
                "shuup_product_variations.admin.views.products.ProductCombinationsView",
                name="shuup_product_variations.product.combinations"
            ),
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/product_variations/$",
                "shuup_product_variations.admin.views.product_variations.ProductVariationsView",
                name="shuup_product_variations.product.variations"
            ),
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/product_variations_variable/$",
                "shuup_product_variations.admin.views.product_variations.ProductVariationVariableDetailView",
                name="shuup_product_variations.product.variations_variable"
            ),
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/product_variations_variable_value/$",
                "shuup_product_variations.admin.views.product_variations.ProductVariationVariableValueDetailView",
                name="shuup_product_variations.product.variations_variable_value"
            ),
            admin_url(
                r"^shuup_product_variations/variations/$",
                "shuup_product_variations.admin.views.variations.VariationsListView",
                name="shuup_product_variations.variations.list"
            )
        ]

    def get_menu_entries(self, request):
        return []

    def get_extra_permissions(self):
        return ("shuup_product_variations.can_edit_variations", "shuup_product_variations_can_create_variations")


class ProductVariationsOrganizer(AdminModule):
    name = _("Product Variations Organizer")

    def get_urls(self):
        return [
            admin_url(
                r"^shuup_product_variations/organizer/$",
                "shuup_product_variations.admin.views.organizer.VariationOganizerView",
                name="shuup_product_variations.product.combinations"
            ),
            admin_url(
                r"^shuup_product_variations/variations/$",
                "shuup_product_variations.admin.views.variations.VariationsListView",
                name="shuup_product_variations.variations.list"
            ),
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/variations_variable/$",
                "shuup_product_variations.admin.views.variations.VariationVariableDetailView",
                name="shuup_product_variations.variations_variable"
            ),
            admin_url(
                r"^shuup_product_variations/(?P<pk>\d+)/variations_variable_value/$",
                "shuup_product_variations.admin.views.variations.VariationVariableValueDetailView",
                name="shuup_product_variations.variations_variable_value"
            ),
        ]

    def get_menu_entries(self, request):
        return [
            MenuEntry(
                text=self.name,
                icon="fa fa-cube",
                url="shuup_product_variations.product.combinations",
                category=SETTINGS_MENU_CATEGORY
            )
        ]
