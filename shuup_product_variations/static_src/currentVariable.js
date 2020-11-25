/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from "react";


export const CurrentVariable = ({productData}) => {
    const [state, setState] = useState({
        updatingSKU: false,
        updatingDefaultPrice: false,
        updatingStockCount: false,
        productData: productData
    });

    const fetchProduct = async (url) => {
        try {
            const res = await fetch(url);
            const data = await res.json();
            console.log(data);
            if (data[0]) {
                setState(prevState => ({
                    ...prevState,
                    product: data[0]
                }))
            }
        } catch {
            // setError(true);
        } finally {
            // setLoading(false);
        }
    };

    function updateSku(event) {
        console.log(state.productData["product_id"]);
    }

    function updateDefaultPrice(event) {
        console.log(state.productData["product_id"]);
    }

    function updateStockCount(event) {
        console.log(state.productData["product_id"]);
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
                productData["stock_count"] ? (
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
