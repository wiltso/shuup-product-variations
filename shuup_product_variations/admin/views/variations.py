# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
import json
from collections import defaultdict

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.transaction import atomic
from django.http import JsonResponse
from django.utils.translation import activate, get_language, ugettext_lazy as _
from django.views.generic import ListView
from shuup.admin.shop_provider import get_shop
from shuup.admin.supplier_provider import get_supplier

from shuup_product_variations.models import VariationVariable, VariationVariableValue

from .serializers import VariableVariableDeleteSerializer, VariableVariableSerializer
from .variations_base import VariationBaseDetailView


class VariationsListView(ListView):
    model = VariationVariableValue

    def get_queryset(self):
        return VariationVariableValue.objects.none()  # lol

    def get(self, request, *args, **kwargs):
        variables_id_to_data = {}
        values_data = defaultdict(list)
        for variable_id, variable_order, variable_name, value_id, value_order, value_name in (
            VariationVariableValue.objects.language(settings.PARLER_DEFAULT_LANGUAGE_CODE)
            .filter(
                variable__translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
                translations__language_code=settings.PARLER_DEFAULT_LANGUAGE_CODE,
            )
            .values_list(
                "variable_id",
                "variable__ordering",
                "variable__translations__name",
                "pk",
                "ordering",
                "translations__value",
            )
            .distinct()
        ):
            variables_id_to_data[variable_id] = {"name": variable_name, "order": variable_order}
            values_data[variable_id].append({"id": value_id, "order": value_order, "name": value_name})

        return JsonResponse({"variables": variables_id_to_data, "values": values_data})

    def post(self, request, *args, **kwargs):
        try:
            variable_data = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({"error": _("Invalid content data"), "code": "invalid-content"}, status=400)

        # use atomic here since the serializer can create the variation variables and values
        with atomic():
            serializer = VariableVariableSerializer(
                data=variable_data, context=dict(shop=get_shop(request), supplier=get_supplier(request))
            )
            if not serializer.is_valid():
                return JsonResponse({"error": serializer.errors, "code": "validation-fail"}, status=400)

            try:
                old_language = get_language()
                activate(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                serializer.save()
                activate(old_language)
            except ValidationError as exc:
                return JsonResponse({"error": ", ".join(exc.messages), "code": exc.code}, status=400)

        return JsonResponse(serializer.validated_data)


class VariationVariableDetailView(VariationBaseDetailView):
    model = VariationVariable

    def delete(self, request, *args, **kwargs):
        try:
            variable_data = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({"error": _("Invalid content data"), "code": "invalid-content"}, status=400)

        # use atomic here since the serializer can create the variation variables and values
        with atomic():
            serializer = VariableVariableDeleteSerializer(
                data=variable_data, context=dict(shop=get_shop(request), supplier=get_supplier(request))
            )
            if not serializer.is_valid():
                return JsonResponse({"error": serializer.errors, "code": "validation-fail"}, status=400)

            try:
                old_language = get_language()
                activate(settings.PARLER_DEFAULT_LANGUAGE_CODE)
                serializer.save()
                activate(old_language)
            except ValidationError as exc:
                return JsonResponse({"error": ", ".join(exc.messages), "code": exc.code}, status=400)

        return JsonResponse(serializer.validated_data)


class VariationVariableValueDetailView(VariationBaseDetailView):
    model = VariationVariableValue
