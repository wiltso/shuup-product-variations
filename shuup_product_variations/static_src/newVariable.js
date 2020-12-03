/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from "react";


export const NewVariable = ({productData, onUpdate}) => {
    const [state, setState] = useState({
        productData: productData,
        onUpdate: onUpdate
    });

    function updateSku(event) {
        const productData = { ...state.productData };
        productData["product__sku"] = event.target.value;
        return state.onUpdate(productData)
    }

    function updateDefaultPrice(event) {
        const productData = { ...state.productData };
        productData["default_price_value"] = event.target.value;
        return state.onUpdate(productData)
    }

    function updateStockCount(event) {
        const productData = { ...state.productData };
        productData["stock_count"] = event.target.value;
        return state.onUpdate(productData)
    }

    return (
        <div className="d-flex flex-row flex-grow-1 align-items-end">
            <div className="d-flex flex-column flex-grow-1">
                <small>{ gettext("SKU") }</small>
                <input
                    type="text"
                    className="form-control"
                    value={productData["product__sku"]}
                    onChange={updateSku}
                />
            </div>
            <div className="d-flex flex-column flex-grow-1 ml-1 mr-1">
                <small>{ gettext("Default Price") }</small>
                <input
                    type="text"
                    className="form-control"
                    value={productData["default_price_value"]}
                    onChange={updateDefaultPrice}
                />
            </div>
            {
                productData["stock_count"] !== undefined ? (
                    <div className="d-flex flex-column flex-grow-1">
                        <small>{ gettext("Inventory") }</small>
                        <input
                            type="text"
                            className="form-control"
                            value={productData["stock_count"]}
                            onChange={updateStockCount}
                        />
                    </div>
                ): (
                    null
                )
            }
            <div className="d-flex align-items-end">
                <a href={`/sa/products/${productData["pk"]}/#product-variations-section`}>
                    <i className="fa fa-edit fa-2x align-self-center ml-4"></i>
                </a>
            </div>        
        </div>
    )
}
