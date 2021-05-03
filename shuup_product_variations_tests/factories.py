# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
from typing import Iterable

from shuup.core.models import ProductVariationVariable, ProductVariationVariableValue


def create_variation_variable(product, variable_name: str, variable_values: Iterable[str]):
    variable = ProductVariationVariable.objects.create(product=product, name=variable_name)
    values = []

    for value in variable_values:
        values.append(ProductVariationVariableValue.objects.create(variable=variable, value=value))

    return (variable, values)
