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
from shuup.core.models import ShopProduct
from decimal import Decimal


@pytest.mark.django_db
def test_create_product_variation(rf, admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)

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
            "price": "15.5",
            "stock_count": 20,
        },
        {
            "combination": {
                "Color": "Blue",
                "Size": "S"
            },
            "sku": "blue-s",
            "price": "16",
            "stock_count": 2,
        },
    ]
    response = client.post(
        reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk)),
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert product.variation_children.count() == 2
    all_combinations = list(product.get_all_available_combinations())

    red_l_combination = [comb for comb in all_combinations if comb["sku_part"] == 'red-l'][0]
    blue_s_combination = [comb for comb in all_combinations if comb["sku_part"] == 'blue-s'][0]

    red_l_shop_product = ShopProduct.objects.get(product_id=red_l_combination["result_product_pk"])
    blue_s_shop_product = ShopProduct.objects.get(product_id=blue_s_combination["result_product_pk"])

    assert red_l_shop_product.product.sku == "red-l"
    assert blue_s_shop_product.product.sku == "blue-s"
    assert red_l_shop_product.default_price_value == Decimal("15.5")
    assert blue_s_shop_product.default_price_value == Decimal("16")

    assert supplier.get_stock_status(red_l_combination["result_product_pk"]).logical_count == 20
    assert supplier.get_stock_status(blue_s_combination["result_product_pk"]).logical_count == 2


@pytest.mark.django_db
def test_update_product_variation(rf, admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)

    client = Client()
    client.force_login(admin_user)
    assert product.variation_children.count() == 0

    create_payload = [{
        "combination": {
            "Color": "Red",
            "Size": "L"
        },
        "sku": "red-l",
        "price": "15.5",
        "stock_count": 20,
    }]
    response = client.post(
        reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk)),
        data=create_payload,
        content_type="application/json",
    )
    assert response.status_code == 200

    update_payload = [{
        "combination": {
            "Color": "Red",
            "Size": "L"
        },
        "sku": "red-l2",
        "price": "21",
        "stock_count": 4,
    }]
    response = client.post(
        reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk)),
        data=update_payload,
        content_type="application/json",
    )
    assert response.status_code == 200

    all_combinations = list(product.get_all_available_combinations())
    red_l_combination = [comb for comb in all_combinations if comb["sku_part"] == 'red-l'][0]
    red_l_shop_product = ShopProduct.objects.get(product_id=red_l_combination["result_product_pk"])
    assert red_l_shop_product.product.sku == "red-l2"
    assert red_l_shop_product.default_price_value == Decimal("21")
    assert supplier.get_stock_status(red_l_combination["result_product_pk"]).logical_count == 4
