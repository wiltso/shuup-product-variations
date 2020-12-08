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
from shuup_product_variations.models import (
    VariationVariable, VariationVariableValue
)

from .variations_base import VariationBaseDetailView


class VariationsListView(ListView):
    model = VariationVariableValue

    def get_queryset(self):
        return VariationVariableValue.objects.none()  # lol

    def get(self, request, *args, **kwargs):
        variables_id_to_data = {}
        values_data = defaultdict(list)
        for variable_id, variable_order, variable_name, value_id, value_order, value_name in (
            VariationVariableValue.objects
                .language(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                .filter(
                    variable__translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
                    translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE
                )
                .values_list(
                    "variable_id",
                    "variable__ordering",
                    "variable__translations__name",
                    "pk",
                    "ordering",
                    "translations__value"
                ).distinct()
        ):
            variables_id_to_data[variable_id] = {"name": variable_name, "order": variable_order}
            values_data[variable_id].append({
                "id": value_id, "order": value_order, "name":  value_name
            })

        return JsonResponse({
            "variables": variables_id_to_data,
            "values": values_data
        })


class VariationVariableDetailView(VariationBaseDetailView):
    model = VariationVariable


class VariationVariableValueDetailView(VariationBaseDetailView):
    model = VariationVariableValue
