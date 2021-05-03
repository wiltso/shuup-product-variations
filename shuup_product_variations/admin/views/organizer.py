# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
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
