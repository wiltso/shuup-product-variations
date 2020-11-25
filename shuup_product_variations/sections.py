# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from __future__ import unicode_literals

from django.utils.translation import ugettext as _

from shuup.admin.base import Section
from shuup.core.models import ProductMode


class ProductVariationsSection(Section):
    identifier = "product_variations"
    name = _("Product Variations")
    icon = "fa-cubes"
    template = "shuup_product_variations/product_variations.jinja"
    extra_js = "shuup_product_variations/product_variations_js.jinja"
    order = 2

    @classmethod
    def visible_for_object(cls, product, request=None):
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
        return {
            "main_product": main_product,
            "mode": main_product.mode,
            "can_create": "true",
            "can_edit": "true",
            "max_variations": 4
        }
