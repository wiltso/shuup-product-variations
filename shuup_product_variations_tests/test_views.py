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
def test_create_product_variation(admin_user):
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
def test_update_product_variation(admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)
    view_url = reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk))

    client = Client()
    client.force_login(admin_user)
    assert product.variation_children.count() == 0

    create_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
        "sku": "red-l",
        "price": "15.5",
        "stock_count": 20,
    }]
    response = client.post(
        view_url,
        data=create_payload,
        content_type="application/json",
    )
    assert response.status_code == 200

    update_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
        "sku": "red-l2",
        "price": "21",
        "stock_count": 4,
    }]
    response = client.post(
        view_url,
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

    # test partial update, just price
    partial_update_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
        "sku": "red-l2",
        "price": "30",
    }]
    response = client.post(
        view_url,
        data=partial_update_payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    red_l_shop_product.refresh_from_db()
    assert red_l_shop_product.default_price_value == Decimal("30")


@pytest.mark.django_db
def test_delete_product_variation(admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)
    view_url = reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk))

    client = Client()
    client.force_login(admin_user)
    assert product.variation_children.count() == 0

    create_payload = [
        {
            "combination": {"Color": "Red", "Size": "L"},
            "sku": "red-l",
        },
        {
            "combination": {"Color": "Blue", "Size": "S"},
            "sku": "blue-s",
        },
        {
            "combination": {"Color": "Green", "Size": "XL"},
            "sku": "green-xl",
        },
        {
            "combination": {"Color": "Red", "Size": "XL"},
            "sku": "red-xl",
        },
    ]
    response = client.post(
        view_url,
        data=create_payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert product.variation_children.count() == 4

    delete_payload = [
        # can delete using the combination
        {
            "combination": {"Color": "Red", "Size": "L"}
        },
        # or by sku
        {
            "sku": "red-xl"
        }
    ]
    response = client.delete(
        view_url,
        data=delete_payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert product.variation_children.count() == 2


@pytest.mark.django_db
def test_error_handling(admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)
    view_url = reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk))
    client = Client()
    client.force_login(admin_user)

    # missing fields
    invalid_create_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
    }]
    response = client.post(view_url, data=invalid_create_payload, content_type="application/json")
    assert response.status_code == 400
    result = response.json()
    assert result["code"] == "validation-fail"
    assert result["error"]["combinations"][0]['sku'][0] == "This field is required."

    # can't create using existing SKU
    invalid_create_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
        "sku": product.sku
    }]
    response = client.post(view_url, data=invalid_create_payload, content_type="application/json")
    assert response.status_code == 400
    result = response.json()
    assert result["error"] == "The SKU 'parent-sku' is already being used."
    assert result["code"] == "sku-exists"

    # successfully create
    invalid_create_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
        "sku": "random"
    }]
    response = client.post(view_url, data=invalid_create_payload, content_type="application/json")
    assert response.status_code == 200

    # can't update using existing SKU
    invalid_create_payload = [{
        "combination": {"Color": "Red", "Size": "L"},
        "sku": product.sku
    }]
    response = client.post(view_url, data=invalid_create_payload, content_type="application/json")
    assert response.status_code == 400
    result = response.json()
    assert result["error"] == "The SKU 'parent-sku' is already being used."
    assert result["code"] == "sku-exists"
