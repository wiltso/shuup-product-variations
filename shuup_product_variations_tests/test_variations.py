# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
import json
import pytest

from decimal import Decimal

from django.core.management import call_command
from django.urls import reverse
from django.test import Client
from parler.utils.context import switch_language
from shuup.testing import factories
from shuup.core.models import (
    ShopProduct, Product, ProductVariationVariable,
    ProductVariationVariableValue
)

from shuup_product_variations.models import (
    VariationVariable, VariationVariableValue
)


@pytest.mark.django_db
def test_variations_aka_variation_template_models(admin_user):
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
                "Size": "XL"
            },
            "sku": "red-xl",
            "price": "3.5",
            "stock_count": 15,
        },
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
    url = reverse(
        "shuup_admin:shuup_product_variations.product.combinations",
        kwargs=dict(pk=shop_product.pk)
    )
    response = client.post(
        url,
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert product.variation_children.count() == 3

    call_command("populate_variations")
    assert VariationVariable.objects.count() == 2
    assert VariationVariableValue.objects.count() == 5

    for vv in VariationVariable.objects.all():
        assert str(vv) in ["Color", "Size"]

    for vvv in VariationVariableValue.objects.all():
        assert str(vvv) in ["XL", "L", "S", "Blue", "Red"]

    response = client.get(
        reverse("shuup_admin:shuup_product_variations.variations.list"),
        content_type="application/json",
    )
    assert response.status_code == 200
    data = json.loads(response.content.decode("utf-8"))
    assert len(data["variables"]) == 2
    assert len(data["values"]) == 2  # One set of values to each variable

    color = VariationVariable.objects.filter(identifier="color").first()
    assert color
    url_for_color = reverse(
        "shuup_admin:shuup_product_variations.variations_variable",
        kwargs={"pk": color.pk}
    )

    assert color.name == "Color"
    with switch_language(color, 'fi'):
        assert color.name == "Color"
    response = client.post(
        url_for_color,
        data={"language_code": "fi", "name": "Väri"},
        content_type="application/json",
    )
    assert response.status_code == 200
    color.refresh_from_db()

    assert color.name == "Color"
    with switch_language(color, 'fi'):
        assert color.name == "Väri"

    assert color.ordering == 0
    response = client.post(
        url_for_color,
        data={"ordering": 3},
        content_type="application/json",
    )
    color.refresh_from_db()
    assert color.ordering == 3

    response = client.delete(
        url_for_color,
        data={"name": "Color"},
        content_type="application/json",
    )
    assert response.status_code == 200
    
    assert VariationVariable.objects.count() == 1
    assert VariationVariableValue.objects.count() == 3

    extralarge = VariationVariableValue.objects.filter(identifier="xl").first()
    assert extralarge
    url_for_extralarge = reverse(
        "shuup_admin:shuup_product_variations.variations_variable_value",
        kwargs={"pk": extralarge.pk}
    )

    assert extralarge.value == "XL"
    with switch_language(extralarge, 'fi'):
        assert extralarge.value == "XL"
    response = client.post(
        url_for_extralarge,
        data={"language_code": "fi", "name": "Aika iso"},
        content_type="application/json",
    )
    assert response.status_code == 200
    extralarge.refresh_from_db()

    assert extralarge.value == "XL"
    with switch_language(extralarge, 'fi'):
        assert extralarge.value == "Aika iso"

    assert extralarge.ordering == 0
    response = client.post(
        url_for_extralarge,
        data={"ordering": 3},
        content_type="application/json",
    )
    extralarge.refresh_from_db()
    assert extralarge.ordering == 3    

    response = client.post(
        reverse("shuup_admin:shuup_product_variations.variations.list"),
        data={"name": "Size", "values": ["XL", "S"]},
        content_type="application/json",
    )
    assert response.status_code == 200
    
    assert VariationVariable.objects.count() == 1
    assert VariationVariableValue.objects.count() == 2

    response = client.post(
        reverse("shuup_admin:shuup_product_variations.variations.list"),
        data={"name": "Size", "values": ["XL", "S", "XS", "2XS"]},
        content_type="application/json",
    )
    assert response.status_code == 200
    
    assert VariationVariable.objects.count() == 1
    assert VariationVariableValue.objects.count() == 4
