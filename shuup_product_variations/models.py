# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
from __future__ import unicode_literals

from django.db import models
from django.utils.translation import ugettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields
from shuup.core.fields import InternalIdentifierField
from shuup.utils.django_compat import force_text
from shuup.utils.models import SortableMixin


class VariationVariable(TranslatableModel, SortableMixin):
    identifier = InternalIdentifierField(unique=False)
    translations = TranslatedFields(
        name=models.CharField(max_length=128, verbose_name=_("name")),
    )

    class Meta:
        verbose_name = _("variation variable")
        verbose_name_plural = _("variation variables")
        ordering = ("ordering",)

    def __str__(self):
        return force_text(self.safe_translation_getter("name") or self.identifier or repr(self))


class VariationVariableValue(TranslatableModel, SortableMixin):
    variable = models.ForeignKey(
        VariationVariable, related_name="values", on_delete=models.CASCADE, verbose_name=_("variation variable")
    )
    identifier = InternalIdentifierField(unique=False)

    translations = TranslatedFields(
        value=models.CharField(max_length=128, verbose_name=_("value")),
    )

    class Meta:
        verbose_name = _("variation value")
        verbose_name_plural = _("variation values")
        unique_together = (
            (
                "variable",
                "identifier",
            ),
        )
        ordering = ("ordering",)

    def __str__(self):
        return force_text(self.safe_translation_getter("value") or self.identifier or repr(self))
