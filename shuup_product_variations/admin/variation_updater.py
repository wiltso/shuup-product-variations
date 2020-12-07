# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
#
# This source code is licensed under the OSL-3.0 license found in the
# LICENSE file in the root directory of this source tree.
from decimal import Decimal
from typing import Dict, NewType, Optional

from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _
from shuup.core.models import (
    Product, ProductVariationLinkStatus, ProductVariationResult,
    ProductVariationVariable, ProductVariationVariableValue, Shop, ShopProduct,
    Supplier
)
from shuup.core.models._product_variation import hash_combination

Combination = NewType("Combination", Dict[ProductVariationVariable, ProductVariationVariableValue])


class VariationUpdater():
    def update_or_create_variation(self, shop: Shop, supplier: Optional[Supplier],  # noqa (C901)
                                   parent_product: Product, combination_data: Dict):
        sku = combination_data["sku"]   # type: str
        combination = combination_data["combination"]   # type: Combination
        combination_hash = hash_combination(combination)

        # search the product by the combination hash
        variation_result = ProductVariationResult.objects.filter(
            product=parent_product,
            combination_hash=combination_hash
        ).first()

        parent_shop_product = parent_product.get_shop_instance(shop)
        # when there is no current supplier set, use the single supplier configured for the product, if any
        if not supplier and parent_shop_product.suppliers.count() == 1:
            supplier = parent_shop_product.suppliers.first()

        # there is already a variation value with a product set,
        # use it and make sure the status is active
        if variation_result:
            variation_child = variation_result.result  # type: Product

            # validate whether the SKU is being used on a different product
            sku_being_used = Product.objects.filter(sku=sku).exclude(pk=variation_child.pk).exists()
            if sku_being_used:
                raise ValidationError(
                    _("The SKU '{sku}' is already being used.").format(sku=sku),
                    code="sku-exists"
                )

            # the result is not visible, make it visible
            if variation_result.status != ProductVariationLinkStatus.VISIBLE:
                variation_result.status = ProductVariationLinkStatus.VISIBLE
                variation_result.save()

            if variation_child.sku != sku:
                variation_child.sku = sku
                variation_child.save()

            # the product is deleted, bring it from the dead
            if variation_child.deleted:
                variation_child.deleted = False
                variation_child.save()

        else:
            # validate whether the SKU is being used on a different product
            existing_product = Product.objects.filter(sku=sku).first()
            variation_child = None

            if existing_product:
                # this product is not deleted, raise an error
                if not existing_product.deleted:
                    raise ValidationError(
                        _("The SKU '{sku}' is already being used.").format(sku=sku),
                        code="sku-exists"
                    )

                # the product is deleted, let's recover it
                # but make sure we have a supplier set for it that match the parent product
                # OR the product doesn't have a ShopProduct attached
                variation_shop_product = ShopProduct.objects.filter(
                    product=existing_product,
                    shop=shop
                ).first()
                if (not variation_shop_product
                        or (supplier and variation_shop_product.suppliers.filter(pk=supplier.pk).exists())):
                    variation_child = recover_deleted_product(
                        shop=shop,
                        parent_product=parent_product,
                        deleted_product=existing_product,
                        combination=combination,
                        combination_hash=combination_hash
                    )

            if not variation_child:
                # create a new variation child for the given combination
                variation_child = create_variation_product(
                    shop=shop,
                    parent_product=parent_product,
                    sku=sku,
                    combination=combination,
                    combination_hash=combination_hash
                )

        variation_shop_product = ShopProduct.objects.get_or_create(
            shop=shop,
            product=variation_child
        )[0]
        variation_shop_product.suppliers.set(parent_shop_product.suppliers.all())

        # set the price
        if combination_data.get("price"):
            variation_shop_product.default_price_value = combination_data["price"]
            variation_shop_product.save(update_fields=["default_price_value"])

        # only update stocks when there is a single supplier
        if supplier and combination_data.get("stock_count"):
            new_stock_total = Decimal(combination_data["stock_count"])
            current_stock_status = supplier.get_stock_status(variation_child.pk)
            supplier.adjust_stock(variation_child.pk, new_stock_total - current_stock_status.logical_count)

        return (variation_child, variation_shop_product)

    def delete_variation(self, shop: Shop, supplier: Optional[Supplier],
                         parent_product: Product, variation: Product):
        variation.soft_delete()
        ProductVariationResult.objects.filter(
            product=parent_product,
            result=variation
        ).update(
            status=ProductVariationLinkStatus.INVISIBLE
        )


def get_variation_product_name(parent_product: Product, combination: Combination):
    variation_part = [
        "{variable}:{variable_value}".format(
            variable=variable.name,
            variable_value=variable_value.value
        )
        for (variable, variable_value) in combination.items()
    ]
    return "{name} - {variation_part}".format(
        name=parent_product.name,
        variation_part=" - ".join(variation_part)
    )


def recover_deleted_product(parent_product: Product,
                            shop: Shop,
                            deleted_product: Product,
                            combination: Combination,
                            combination_hash: str) -> Product:
    deleted_product.name = get_variation_product_name(parent_product, combination)
    deleted_product.tax_class = parent_product.tax_class
    deleted_product.sales_unit = parent_product.sales_unit
    deleted_product.shipping_mode = parent_product.shipping_mode
    deleted_product.type = parent_product.type
    deleted_product.manufacturer = parent_product.manufacturer
    deleted_product.height = parent_product.height
    deleted_product.depth = parent_product.depth
    deleted_product.net_weight = parent_product.net_weight
    deleted_product.gross_weight = parent_product.gross_weight
    deleted_product.deleted = False
    deleted_product.save()
    deleted_product.link_to_parent(parent_product, combination_hash=combination_hash)
    return deleted_product


def create_variation_product(parent_product: Product,
                             shop: Shop,
                             sku: str,
                             combination: Combination,
                             combination_hash: str) -> Product:
    variation_child = Product(
        name=get_variation_product_name(parent_product, combination),
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
