# -*- coding: utf-8 -*-
# This file is part of Shuup.
#
# Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
#
# This source code is licensed under the Shuup Commerce Inc -
# SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
# and the Licensee.
from decimal import Decimal
from typing import Dict, NewType, Optional

from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _
from shuup.core.models import Product, ProductVariationLinkStatus, ProductVariationResult, Shop, ShopProduct, Supplier
from shuup.core.models._product_variation import hash_combination
from shuup.utils.djangoenv import has_installed

Combination = NewType("Combination", Dict[str, str])


class VariationUpdater:
    def update_or_create_variation(  # noqa (C901)
        self,
        shop: Shop,
        supplier: Optional[Supplier],
        parent_shop_product: ShopProduct,
        combination_data: Dict,
    ):
        sku = combination_data["sku"]  # type: str
        combination_instance_data = combination_data["combination_data"]  # type: Combination
        combination_hash = hash_combination(combination_instance_data["combination_pks"])

        # search the product by the combination hash
        variation_result = ProductVariationResult.objects.filter(
            product=parent_shop_product.product, combination_hash=combination_hash
        ).first()

        # there is already a variation value with a product set,
        # use it and make sure the status is active
        if variation_result:
            variation_child = variation_result.result  # type: Product

            # validate whether the SKU is being used on a different product
            sku_being_used = Product.objects.filter(sku=sku).exclude(pk=variation_child.pk).exists()
            if sku_being_used:
                raise ValidationError(_("The SKU '{sku}' is already being used.").format(sku=sku), code="sku-exists")

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
                        _("The SKU '{sku}' is already being used.").format(sku=sku), code="sku-exists"
                    )

                # the product is deleted, let's recover it
                # but make sure we have a supplier set for it that match the parent product
                # OR the product doesn't have a ShopProduct attached
                variation_shop_product = ShopProduct.objects.filter(product=existing_product, shop=shop).first()
                if not variation_shop_product or (
                    supplier and variation_shop_product.suppliers.filter(pk=supplier.pk).exists()
                ):
                    variation_child = recover_deleted_product(
                        shop=shop,
                        parent_product=parent_shop_product.product,
                        deleted_product=existing_product,
                        combination=combination_instance_data["combination_names"],
                        combination_hash=combination_hash,
                    )

            if not variation_child:
                # create a new variation child for the given combination
                variation_child = create_variation_product(
                    shop=shop,
                    parent_product=parent_shop_product.product,
                    sku=sku,
                    combination=combination_instance_data["combination_names"],
                    combination_hash=combination_hash,
                )

        variation_shop_product = ShopProduct.objects.get_or_create(shop=shop, product=variation_child)[0]
        price = Decimal(combination_data.get("price", "0"))
        if has_installed("shuup_multivendor"):
            from shuup_multivendor.models import SupplierPrice

            SupplierPrice.objects.update_or_create(
                shop=shop, product=variation_child, supplier=supplier, defaults=dict(amount_value=price)
            )

            # If we have multivendor feature on and product is linked to
            # multiple suppliers we always want to store cheapest price
            # among suppliers to the shop product default price value
            cheapest_supplier_price_obj = (
                SupplierPrice.objects.filter(shop=shop, product=variation_child).order_by("amount_value").first()
            )
            price = min([cheapest_supplier_price_obj.amount_value, price])

        variation_shop_product.default_price_value = price
        variation_shop_product.save()

        # only update stocks when there is a single supplier
        if supplier and combination_data.get("stock_count") is not None:
            new_stock_total = Decimal(combination_data["stock_count"])
            current_stock_status = supplier.get_stock_status(variation_child.pk)
            supplier.adjust_stock(variation_child.pk, new_stock_total - current_stock_status.logical_count)

        return (variation_child, variation_shop_product)

    def delete_variation(self, shop: Shop, supplier: Optional[Supplier], parent_product: Product, variation: Product):
        variation.soft_delete()
        ProductVariationResult.objects.filter(product=parent_product, result=variation).update(
            status=ProductVariationLinkStatus.INVISIBLE
        )


def get_variation_product_name(parent_product: Product, combination: Combination):
    variation_part = [
        "{variable_value}".format(variable_value=variable_value) for (variable, variable_value) in combination.items()
    ]
    return "{name} - {variation_part}".format(name=parent_product.name, variation_part=" - ".join(variation_part))


def recover_deleted_product(
    parent_product: Product, shop: Shop, deleted_product: Product, combination: Combination, combination_hash: str
) -> Product:
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


def create_variation_product(
    parent_product: Product, shop: Shop, sku: str, combination: Combination, combination_hash: str
) -> Product:
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
