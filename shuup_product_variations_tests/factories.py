# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from typing import Iterable
from shuup.core.models import ProductVariationVariable, ProductVariationVariableValue


def create_variation_variable(product, variable_name: str, variable_values: Iterable[str]):
    variable = ProductVariationVariable.objects.create(
        product=product,
        name=variable_name
    )
    values = []

    for value in variable_values:
        values.append(
            ProductVariationVariableValue.objects.create(
                variable=variable,
                value=value
            )
        )

    return (variable, values)
