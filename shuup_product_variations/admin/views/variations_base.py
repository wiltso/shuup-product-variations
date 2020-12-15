# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
import json

from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils.translation import ugettext_lazy as _
from django.views.generic import DetailView
from parler.utils.context import switch_language
from shuup_product_variations.admin.views.serializers import (
    OrderingSerializer, TranslationSerializer
)


class VariationBaseDetailView(DetailView):

    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return JsonResponse({
                "error": _("Variable not found"),
                "code": "product-not-found"
            }, status=404)

        try:
            data = json.loads(request.body)
        except (json.decoder.JSONDecodeError, TypeError):
            return JsonResponse({
                "error": _("Invalid content data"),
                "code": "invalid-content"
            }, status=400)

        serializer = OrderingSerializer(
            data=data,
            context=dict(item=instance)
        )
        if not serializer.is_valid():
            serializer = TranslationSerializer(
                data=data,
                context=dict(item=instance)
            )
            if not serializer.is_valid():
                return JsonResponse({
                    "error": serializer.errors,
                    "code": "validation-fail"
                }, status=400)

        try:
            serializer.save()
        except ValidationError as exc:
            return JsonResponse({
                "error": exc.message,
                "code": exc.code
            }, status=400)

        return JsonResponse({})

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        data = {}
        for language_code, language_name in settings.LANGUAGES:
            with switch_language(self.object, language_code):
                data[language_code] = {
                    "language_name": language_name,
                    "name": (self.object.name if hasattr(self.object, "name") else self.object.value)
                }
        return JsonResponse(data)
