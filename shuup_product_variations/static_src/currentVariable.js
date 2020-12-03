/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.xsrfHeaderName = "X-CSRFToken"
axios.defaults.xsrfCookieName = "csrftoken"
import {
    ensureDecimalPlaces,
} from "./utils"


export const CurrentVariable = ({productData, updating, onSuccess}) => {
    const [state, setState] = useState({
        // statuses for sku input
        updatingSKU: false,
        skuUpdateError: "",
        skuUpdateSuccess: false,

        // statuses for default price input
        updatingDefaultPrice: false,
        defaultPriceUpdateError: "",
        defaultPriceUpdateSuccess: false,

        // statuses for stock count input
        updatingStockCount: false,
        stockCountUpdateError: "",
        stockCountUpdateSuccess: false,

        // current product data for the row
        productData: productData
    });

    /*
        change input values based on user inputs
    */
    function changeSKU(event) {
        const productData = {...state.productData};
        productData["product__sku"] = event.target.value;
        return setState(prevState => ({
            ...prevState,
            productData
        }));
    }

    function changeDefaultPrice(event) {
        const productData = {...state.productData};
        productData["default_price_value"] = ensureDecimalPlaces(event.target.value.replace(",", "."));
        return setState(prevState => ({
            ...prevState,
            productData
        }));
    }

    function changeStockCount(event) {
        const productData = {...state.productData};
        productData["stock_count"] = event.target.value;
        return setState(prevState => ({
            ...prevState,
            productData
        }));
    }

    useEffect(() => {
        console.log(productData["default_price_value"])
        const ensuredValue = ensureDecimalPlaces(productData["default_price_value"]);
        console.log(ensuredValue);
        if (productData["default_price_value"] != ensuredValue) {
            const productData = {...state.productData};
            productData["default_price_value"] = ensuredValue;
            return setState(prevState => ({
                ...prevState,
                productData
            }));
        }
    }, []);

    /*
        update values to the backend application

        Notes:
          - disable all inputs for the row
          - show updating help text
          - on success show success help text and refetch combinations for the main state
          - on error show error help text and stop the update
    */
    function updateSKU() {
        axios.post("/sa/", {"new_sku": state.productData["product__sku"]})
            .then((response) => {
                console.log("updating sku")

                onSuccess();
                setState(prevState => ({
                    ...prevState,
                    updatingSKU: false,
                    skuUpdateSuccess: true
                }));
            })
            .catch((response) => {
                console.log("updating sku failed")
                setState(prevState => ({
                    ...prevState,
                    updatingSKU: false,
                    skuUpdateError: "error"
                }));
            });

        return setState(prevState => ({
            ...prevState,
            updatingSKU: true
        }));
    }

    function updateDefaultPrice() {
        axios.post("/sa/", {"new_price": state.productData["default_price_value"]})
            .then((response) => {
                console.log(response)
                console.log("updating price")
                onSuccess();
                setState(prevState => ({
                    ...prevState,
                    updatingDefaultPrice: false,
                    defaultPriceUpdateSuccess: true
                }));
            })
            .catch((response) => {
                console.log(response)
                console.log("updating price failed")
                setState(prevState => ({
                    ...prevState,
                    updatingDefaultPrice: false,
                    defaultPriceUpdateError: "error"
                }));
            });
        return setState(prevState => ({
            ...prevState,
            updatingDefaultPrice: true
        }));
    }

    function updateStockCount() {
        axios.post("/sa/", {"new_stock_count": state.productData["stock_count"]})
        .then((response) => {
            console.log(response)
            console.log("updating stock")

            onSuccess();
            setState(prevState => ({
                ...prevState,
                updatingStockCount: false,
                stockCountUpdateSuccess: true
            }));
        })
        .catch((response) => {
            console.log(response)
            console.log("updating stock failed")
            setState(prevState => ({
                ...prevState,
                updatingStockCount: false,
                stockCountUpdateError: "error"
            }));
        });

        return setState(prevState => ({
            ...prevState,
            updatingStockCount: true
        }));
    }

    /*
        define help texts shown for the inputs

        Note:
            - each input has default help text so that the elements
              do not jump when the updating starts
    */
    const disableInputs = (
        updating || state.updatingSKU || state.updatingDefaultPrice || state.updatingStockCount ||
        state.skuUpdateSuccess || state.defaultPriceUpdateSuccess || state.stockCountUpdateSuccess
    );
    const updatingElement = (
        <small className="text-warning">{ gettext("Updating...") }</small>
    );
    const updateSuccessElement = (
        <small className="text-success">{ gettext("Updated!") }</small>
    );
    
    let skuHelpText = <small className="text-info">&nbsp;</small>;
    if (state.updatingSKU) {
        skuHelpText = updatingElement;
    } else if (state.skuUpdateSuccess) {
        skuHelpText = updateSuccessElement;
    } else if (state.skuUpdateError) {
        skuHelpText = <small className="text-danger">{ state.skuUpdateError }</small>;
    }

    let defaultPriceHelpText = <small className="text-info">&nbsp;</small>;
    if (state.updatingDefaultPrice) {
        defaultPriceHelpText = updatingElement;
    } else if (state.defaultPriceUpdateSuccess) {
        defaultPriceHelpText = updateSuccessElement;
    } else if (state.defaultPriceUpdateError) {
        defaultPriceHelpText = <small className="text-danger">{ state.defaultPriceUpdateError }</small>;
    }

    let stockCountHelpText = <small className="text-info">&nbsp;</small>;
    if (state.updatingStockCount) {
        stockCountHelpText = updatingElement;
    } else if (state.stockCountUpdateSuccess) {
        stockCountHelpText = updateSuccessElement;
    } else if (state.stockCountUpdateError) {
        stockCountHelpText = <small className="text-danger">{ state.stockCountUpdateError }</small>;
    }
    
    /*
        render the actual row
    */
    return (
        <div className="d-flex flex-row flex-grow-1 align-items-end">
            <div className="d-flex flex-column flex-grow-1">
                <small>{ gettext("SKU") }</small>
                <input
                    type="text"
                    className="form-control"
                    value={state.productData["product__sku"]}
                    onChange={changeSKU}
                    onBlur={updateSKU}
                    disabled={disableInputs}
                />
                { skuHelpText }
            </div>
            <div className="d-flex flex-column flex-grow-1 ml-1 mr-1">
            <small>{ gettext("Default Price") }</small>
                <input
                    type="text"
                    className="form-control"
                    value={state.productData["default_price_value"]}
                    onChange={changeDefaultPrice}
                    onBlur={updateDefaultPrice}
                    disabled={disableInputs}
                />
                { defaultPriceHelpText }
            </div>
            {
                state.productData["stock_count"] ? (
                    <div className="d-flex flex-column flex-grow-1">
                        <small>{ gettext("Inventory") }</small>
                        <input
                            type="text"
                            className="form-control"
                            value={state.productData["stock_count"]}
                            onChange={changeStockCount}
                            onBlur={updateStockCount}
                            disabled={disableInputs}
                        />
                        { stockCountHelpText }
                    </div>
                ) : (
                    null
                )
            }
            <div className="d-flex flex-column align-items-end">
                <a href={`/sa/products/${productData["pk"]}/#product-variations-section`}>
                    <i className="fa fa-edit fa-2x align-self-center ml-2"></i>
                </a>
                <small className="text-info align-self-center">{ gettext("Edit") }</small>
            </div>        
        </div>
    )
}
