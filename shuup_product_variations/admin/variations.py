# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from collections import defaultdict

from django.conf import settings
from django.http import JsonResponse
from django.views.generic import ListView

from shuup_product_variations.models import VariationVariableValue


class VariationsList(ListView):
    model = VariationVariableValue

    def get_queryset(self):
        return VariationVariableValue.objects.none()  # lol

    def get(self, request, *args, **kwargs):
        variations_data = defaultdict(list)
        for variable, value in (
            VariationVariableValue.objects
                .language(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                .all()
                .values_list("variable__translations__name", "translations__value")
        ):
            variations_data[variable].append(value)

        return JsonResponse({"variations": variations_data})
