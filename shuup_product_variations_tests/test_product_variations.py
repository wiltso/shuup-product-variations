# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
import json

import pytest
from django.test import Client
from django.urls import reverse
from parler.utils.context import switch_language
from shuup.core.models import ProductVariationVariable, ProductVariationVariableValue
from shuup.testing import factories


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
            "combination": {"Color": "Red", "Size": "XL"},
            "sku": "red-xl",
            "price": "3.5",
            "stock_count": 15,
        },
        {
            "combination": {"Color": "Red", "Size": "L"},
            "sku": "red-l",
            "price": "15.5",
            "stock_count": 20,
        },
        {
            "combination": {"Color": "Blue", "Size": "S"},
            "sku": "blue-s",
            "price": "16",
            "stock_count": 2,
        },
    ]
    url = reverse("shuup_admin:shuup_product_variations.product.combinations", kwargs=dict(pk=shop_product.pk))
    response = client.post(
        url,
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert product.variation_children.count() == 3

    response = client.get(
        reverse("shuup_admin:shuup_product_variations.product.variations", kwargs={"pk": product.pk}),
        content_type="application/json",
    )
    assert response.status_code == 200
    data = json.loads(response.content.decode("utf-8"))
    assert len(data["variables"]) == 2
    assert len(data["values"]) == 2  # One set of values to each variable

    color = ProductVariationVariable.objects.filter(identifier="color").first()
    assert color
    url_for_color = reverse("shuup_admin:shuup_product_variations.product.variations_variable", kwargs={"pk": color.pk})

    assert color.name == "Color"
    with switch_language(color, "fi"):
        assert color.name == "Color"
    response = client.post(
        url_for_color,
        data={"language_code": "fi", "name": "Väri"},
        content_type="application/json",
    )
    assert response.status_code == 200
    color.refresh_from_db()

    assert color.name == "Color"
    with switch_language(color, "fi"):
        assert color.name == "Väri"

    assert color.ordering == 0
    response = client.post(
        url_for_color,
        data={"ordering": 3},
        content_type="application/json",
    )
    color.refresh_from_db()
    assert color.ordering == 3

    extralarge = ProductVariationVariableValue.objects.filter(identifier="xl").first()
    assert extralarge
    url_for_extralarge = reverse(
        "shuup_admin:shuup_product_variations.product.variations_variable_value", kwargs={"pk": extralarge.pk}
    )

    assert extralarge.value == "XL"
    with switch_language(extralarge, "fi"):
        assert extralarge.value == "XL"
    response = client.post(
        url_for_extralarge,
        data={"language_code": "fi", "name": "Melko iso"},
        content_type="application/json",
    )
    assert response.status_code == 200
    extralarge.refresh_from_db()

    assert extralarge.value == "XL"
    with switch_language(extralarge, "fi"):
        assert extralarge.value == "Melko iso"

    assert extralarge.ordering == 0
    response = client.post(
        url_for_extralarge,
        data={"ordering": 3},
        content_type="application/json",
    )
    extralarge.refresh_from_db()
    assert extralarge.ordering == 3
