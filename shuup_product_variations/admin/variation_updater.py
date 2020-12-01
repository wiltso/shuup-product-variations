# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from typing import Dict

from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _
from shuup.core.models import (
    Product, ProductVariationLinkStatus, ProductVariationResult,
    ProductVariationVariable, ProductVariationVariableValue, Shop, ShopProduct
)
from shuup.core.models._product_variation import hash_combination


def update_or_create_variation_product(shop: Shop, parent_product: Product, combination_data: Dict):
    sku = combination_data["sku"]   # type: str
    combination = combination_data["combination"]  # type: Dict[ProductVariationVariable, ProductVariationVariableValue]
    combination_hash = hash_combination(combination)

    # search the product by the combination hash
    variation_result = ProductVariationResult.objects.filter(
        product__variation_parent=parent_product,
        combination_hash=combination_hash
    ).first()

    # there is already a variation value with a product set,
    # use it and make sure the status is active
    if variation_result:
        variation_child = variation_result.product  # type: Product

        # validate whether the SKU is being used on a different product
        sku_being_used = Product.objects.filter(sku=sku).exclude(pk=variation_child.pk).exists()
        if sku_being_used:
            raise ValidationError(_("The SKU '{sku}' is already being used.").format(sku=sku))

        # the result is not visible, make it visible
        if variation_result.status != ProductVariationLinkStatus.VISIBLE:
            variation_result.status = ProductVariationLinkStatus.VISIBLE
            variation_result.save()

        # the product is deleted, bring it from the dead
        if variation_child.deleted:
            variation_child.deleted = False
            variation_child.save()

        variation_shop_product = ShopProduct.objects.get_or_create(
            shop=shop,
            product=variation_child
        )[0]

    else:
        # validate whether the SKU is being used on a different product
        sku_being_used = Product.objects.filter(sku=sku).exists()
        if sku_being_used:
            raise ValidationError(_("The SKU '{sku}' is already being used.").format(sku=sku))

        # create a new variation child for the given combination
        variation_child = create_variation_product(
            shop=shop,
            parent_product=parent_product,
            sku=sku,
            combination_hash=combination_hash
        )

    parent_shop_product = parent_product.get_shop_instance(shop)
    variation_shop_product = ShopProduct.objects.get_or_create(
        shop=shop,
        product=variation_child
    )[0]
    variation_shop_product.suppliers.set(parent_shop_product.suppliers.all())

    return (variation_child, variation_shop_product)


def create_variation_product(parent_product: Product, shop: Shop, sku: str, combination_hash: str) -> Product:
    variation_child = Product(
        name=parent_product.name,
        tax_class=parent_product.tax_class,
        sales_unit=parent_product.sales_unit,
        sku=sku,
        shipping_mode=parent_product.shipping_mode,
        type=parent_product.type,
        manufacturer=parent_product.manufacturer,
        height=parent_product.height,
        depth=parent_product.depth,
        net_weight=parent_product.net_weight,
        gross_weight=parent_product.gross_weight,
    )
    variation_child.full_clean()
    variation_child.save()
    variation_child.link_to_parent(parent_product, combination_hash=combination_hash)
    return variation_child
