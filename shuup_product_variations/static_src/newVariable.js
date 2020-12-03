/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from "react";
import {
    ensureDecimalPlaces,
} from "./utils"


export const NewVariable = ({productData, updating, onUpdate}) => {
    const [state, setState] = useState({
        productData: productData,
        onUpdate: onUpdate
    });

    /*
        update skus through main state so the updated values are
        there when the actual update is finalized for these new items
    */
    function updateSku(event) {
        const productData = { ...state.productData };
        productData["product__sku"] = event.target.value;
        return state.onUpdate(productData)
    }

    function updateDefaultPrice(event) {
        const productData = { ...state.productData };
        productData["default_price_value"] = ensureDecimalPlaces(event.target.value.replace(",", "."));
        return state.onUpdate(productData)
    }

    function updateStockCount(event) {
        const productData = { ...state.productData };
        productData["stock_count"] = event.target.value;
        return state.onUpdate(productData)
    }

    useEffect(() => {
        console.log(productData["default_price_value"])
        const ensuredValue = ensureDecimalPlaces(productData["default_price_value"]);
        console.log(ensuredValue);
        if (productData["default_price_value"] != ensuredValue) {
            const productData = { ...state.productData };
            productData["default_price_value"] = ensuredValue;
            onUpdate(productData)
        }
    }, []);

    /*
        render the actual row for this new item

        Note:
          - if main state is updating all these inputs shall be disabled
    */
    return (
        <div className="d-flex flex-row flex-grow-1 align-items-end">
            <div className="d-flex flex-column flex-grow-1">
                <small>{ gettext("SKU") }</small>
                <input
                    type="text"
                    className="form-control"
                    value={productData["product__sku"]}
                    onChange={updateSku}
                    disabled={updating}
                />
            </div>
            <div className="d-flex flex-column flex-grow-1 ml-1 mr-1">
                <small>{ gettext("Default Price") }</small>
                <input
                    type="text"
                    className="form-control"
                    value={productData["default_price_value"]}
                    onChange={updateDefaultPrice}
                    disabled={updating}
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
                            disabled={updating}
                        />
                    </div>
                ): (
                    null
                )
            }   
        </div>
    )
}
