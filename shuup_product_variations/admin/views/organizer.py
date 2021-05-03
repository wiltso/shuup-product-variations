# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
from django.urls import reverse
from django.views.generic import TemplateView


class VariationOganizerView(TemplateView):
    template_name = "shuup_product_variations/organizer.jinja"

    def get_context_data(self, **kwargs):
        context = super(VariationOganizerView, self).get_context_data(**kwargs)

        context["product_variations"] = {
            "variation_url": reverse("shuup_admin:shuup_product_variations.variations.list"),
            "variable_url": reverse(
                "shuup_admin:shuup_product_variations.variations_variable", kwargs={"pk": 9999}
            ).replace("9999", "xxxx"),
            "variable_value_url": reverse(
                "shuup_admin:shuup_product_variations.variations_variable_value", kwargs={"pk": 9999}
            ).replace("9999", "xxxx"),
        }

        return context
