# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
import pytest
from django.urls import reverse
from django.test import Client
from shuup.testing import factories

from .factories import create_variation_variable


@pytest.mark.django_db
def test_create_product_variation(rf, admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_default_supplier(shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)

    variable1, variable1_values = create_variation_variable(product, "Color", ["Red", "Green", "Blue"])
    variable2, variable2_values = create_variation_variable(product, "Size", ["S", "L", "XL"])

    client = Client()
    client.force_login(admin_user)

    assert product.variation_children.count() == 0

    payload = [
        {
            "combination": {
                "Color": "Red",
                "Size": "L"
            },
            "sku": "red-l",
            "price": 15.5,
            "stock_count": 20,
        },
        {
            "combination": {
                "Color": "Blue",
                "Size": "S"
            },
            "sku": "blue-s",
            "price": 16,
            "stock_count": 2,
        },
    ]
    response = client.post(
        reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk)),
        payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert product.variation_children.count() == 2
