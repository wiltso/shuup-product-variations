# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.views.generic import TemplateView


class VariationOganizerView(TemplateView):
    template = "shuup_product_variations/organizer.jinja"

    def get_context_data(self, **kwargs):
        context = super(VariationOganizerView, self).get_context_data(**kwargs)

        return context
