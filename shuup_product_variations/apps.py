# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
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
