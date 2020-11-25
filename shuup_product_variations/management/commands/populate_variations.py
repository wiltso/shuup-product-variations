# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from django.conf import settings
from django.core.management import BaseCommand
from django.utils.text import slugify
from django.utils.translation import activate
from shuup.core.models import ProductVariationVariableValue

from shuup_product_variations.models import VariationVariable, VariationVariableValue


class Command(BaseCommand):

    def handle(self, *args, **options):
        activate(settings.PARLER_DEFAULT_LANGUAGE_CODE)

        for variation, variation_value in (
            ProductVariationVariableValue.objects
                .language()
                .all()
                .values_list("variable__translations__name", "translations__value")
        ):
            variable, created = VariationVariable.objects.get_or_create(
                identifier=slugify(variation),
                defaults=dict(name=variation)
            )
            value, crated = VariationVariableValue.objects.get_or_create(
                variable=variable,
                identifier=slugify(variation_value),
                defaults=dict(value=variation_value)
            )
