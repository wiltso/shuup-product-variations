# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
import pytest

from shuup.testing import factories
from shuup.testing.utils import apply_request_middleware

from shuup_product_variations.sections import ProductVariationsSection


@pytest.mark.django_db
def test_product_admin_section_visibility(rf, admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)

    request = apply_request_middleware(rf.get("/"), user=admin_user, shop=shop)
    assert ProductVariationsSection.visible_for_object(product, request)

    shop_product.suppliers.clear()
    assert not ProductVariationsSection.visible_for_object(product, request)

    product.pk = None
    request = apply_request_middleware(rf.get("/"), user=admin_user)
    assert not ProductVariationsSection.visible_for_object(product, request)

    request = apply_request_middleware(rf.get("/"), user=admin_user)
    request.shop = None
    assert not ProductVariationsSection.visible_for_object(product, request)


@pytest.mark.django_db
def test_product_admin_section_context(rf, admin_user):
    shop = factories.get_default_shop()
    supplier = factories.get_supplier("simple_supplier", shop)
    product = factories.create_product("parent-sku", shop=shop, supplier=supplier)
    shop_product = product.get_shop_instance(shop)

    request = apply_request_middleware(rf.get("/"), user=admin_user, shop=shop)
    assert ProductVariationsSection.get_context_data(product, request)
