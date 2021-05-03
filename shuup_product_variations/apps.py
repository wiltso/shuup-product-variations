# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
import shuup.apps


class AppConfig(shuup.apps.AppConfig):
    name = "shuup_product_variations"
    label = "shuup_product_variations"
    provides = {
        "admin_module": [
            "shuup_product_variations.admin:ProductVariationsModule",
            "shuup_product_variations.admin:ProductVariationsOrganizer",
        ],
        "admin_product_section": [
            "shuup_product_variations.sections:ProductVariationsSection",
        ],
        "admin_vendor_product_form_part": [],
    }
