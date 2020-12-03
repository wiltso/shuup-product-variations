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
    ensureDecimalPlaces, getNewDataForCombination,
} from "./utils"


export const CurrentVariable = ({combination, productData, updating, onSuccess}) => {
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
        let newValue = event.target.value
        if (newValue === "") {
            newValue = "0";
        }

        productData["default_price_value"] = ensureDecimalPlaces(newValue.replace(",", "."));
        return setState(prevState => ({
            ...prevState,
            productData
        }));
    }

    function changeStockCount(event) {
        const productData = {...state.productData};
        let newValue = event.target.value;
        if (newValue === "") {
            newValue = "0"
        }

        productData["stock_count"] = newValue;
        return setState(prevState => ({
            ...prevState,
            productData
        }));
    }

    useEffect(() => {
        const ensuredValue = ensureDecimalPlaces(productData["default_price_value"] || 0);
        if (productData["default_price_value"] != ensuredValue) {
            const productData = {...state.productData};
            productData["default_price_value"] = ensuredValue;
            return setState(prevState => ({
                ...prevState,
                productData
            }));
        }
    }, []);

    function getURL() {
        return `/sa/shuup_product_variations/${window.SHUUP_PRODUCT_VARIATIONS_DATA["product_id"]}/combinations/`;
    }

    function getData() {
        return [{
            combination,
            "sku": state.productData["product__sku"],
            "price": state.productData["default_price_value"],
            "stock_count": state.productData["stock_count"]
        }]
    }

    /*
        update values to the backend application

        Notes:
          - disable all inputs for the row
          - show updating help text
          - on success show success help text and refetch combinations for the main state
          - on error show error help text and stop the update
    */
    function updateSKU() {
        axios.post(getURL(), getData())
            .then((response) => {
                onSuccess();
                setState(prevState => ({
                    ...prevState,
                    updatingSKU: false,
                    skuUpdateSuccess: true,
                    defaultPriceUpdateSuccess: false,
                    stockCountUpdateSuccess: false
                }));
            })
            .catch((error) => {
                let errorText = gettext("Updating SKU failed");
                if (error.response && error.response.data && error.response.data.error) {
                    errorText = error.response.data.error;
                }

                if (window._.isObject(errorText)) {
                    if (errorText.combinations) {
                        errorText = errorText.combinations[0].sku
                    }
                }

                setState(prevState => ({
                    ...prevState,
                    updatingSKU: false,
                    skuUpdateSuccess: false,
                    defaultPriceUpdateSuccess: false,
                    stockCountUpdateSuccess: false,
                    skuUpdateError: errorText
                }));
            });

        return setState(prevState => ({
            ...prevState,
            updatingSKU: true
        }));
    }

    function updateDefaultPrice() {
        axios.post(getURL(), getData())
            .then((response) => {
                onSuccess();
                setState(prevState => ({
                    ...prevState,
                    updatingDefaultPrice: false,
                    skuUpdateSuccess: false,
                    defaultPriceUpdateSuccess: true,
                    stockCountUpdateSuccess:false
                }));
            })
            .catch((error) => {
                let errorText = gettext("Updating price failed");
                if (error.response && error.response.data && error.response.data.error) {
                    errorText = error.response.data.error;
                }

                if (window._.isObject(errorText)) {
                    if (errorText.combinations) {
                        errorText = errorText.combinations[0].price
                    }
                }

                setState(prevState => ({
                    ...prevState,
                    updatingDefaultPrice: false,
                    skuUpdateSuccess: false,
                    defaultPriceUpdateSuccess: false,
                    stockCountUpdateSuccess: false,
                    defaultPriceUpdateError: errorText
                }));
            });
        return setState(prevState => ({
            ...prevState,
            updatingDefaultPrice: true
        }));
    }

    function updateStockCount() {
        axios.post(getURL(), getData())
            .then((response) => {
                onSuccess();
                setState(prevState => ({
                    ...prevState,
                    updatingStockCount: false,
                    skuUpdateSuccess: false,
                    defaultPriceUpdateSuccess: false,
                    stockCountUpdateSuccess: true
                }));
            })
            .catch((error) => {
                let errorText = gettext("Updating price failed");
                if (error.response && error.response.data && error.response.data.error) {
                    errorText = error.response.data.error;
                }

                if (window._.isObject(errorText)) {
                    if (errorText.combinations) {
                        errorText = errorText.combinations[0].stock_count
                    }
                }

                setState(prevState => ({
                    ...prevState,
                    updatingStockCount: false,
                    skuUpdateSuccess: false,
                    defaultPriceUpdateSuccess: false,
                    stockCountUpdateSuccess: false,
                    stockCountUpdateError: errorText
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
        updating || state.updatingSKU || state.updatingDefaultPrice || state.updatingStockCount
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
