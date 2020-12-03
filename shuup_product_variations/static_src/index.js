/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ReactDOM from "react-dom";
import React, { useEffect, useState } from "react";
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select'
import { CurrentVariable } from "./currentVariable";
import { NewVariable } from "./newVariable";
import { ProductVariationOrganizer } from "./productVariationOrganizer";
import {
    getCombinations,
    getNewDataForCombination,
    getProductIdForCombination,
    isCombinationInCombinations,
    updateNewDataForCombination
} from "./utils";

const App = () => {
    const [state, setState] = useState({
        
        // Some data for handling current state
        productIdToCombinationMap: {},
        productData: [],
        variationData: {},
        newVariationData: {},
        preSavedVariationsData: {},

        // Pending data data that needs to be sent to server
        newProductData: [],
        productIdsToDelete: [],

        // three different modes
        loading: false,
        updating: false,
        organizing: false,
    });

    /*
        Initialize the state
    */
    const fetchCombinations = async (url) => {
        try {
            const res = await fetch(url);
            const data = await res.json();
            const variationResults = data["combinations"];
            const productData = data["product_data"]
            const variationData = {};
            const productIdToCombinationMap = {};
            if (variationResults) {
                variationResults.forEach((item) => {
                    let combination = item["combination"]
                    productIdToCombinationMap[item["product"]] = combination;
                    Object.keys(combination).forEach((variable) => {
                        let value = combination[variable];
                        if (variationData[variable] === undefined) {
                            variationData[variable] = [value]
                        } else {
                            if (!variationData[variable].includes(value)){
                                variationData[variable].push(value)
                            }
                        }
                    })
                });
                setState(prevState => ({
                    ...prevState,
                    productIdToCombinationMap,
                    productData,
                    variationData,
                    loading: false,
                    updating: false
                }))
            }
        } catch {
            // setError(true);
        } finally {
            // setLoading(false);
        }
    };

    const fetchVariations = async (url) => {
        try {
            const res = await fetch(url);
            const data = await res.json();
            const preSavedVariationsData = data["variations"] || {};
            setState(prevState => ({
                ...prevState,
                preSavedVariationsData,
            }))
        } catch {
            // setError(true);
        } finally {
            // setLoading(false);
        }
    };
    useEffect(() => {
        console.log("fetching stuff")
        setState(prevState => { return { ...prevState, loading: true } })
        const variationURL = `/sa/shuup_product_variations/variations/`
        fetchVariations(variationURL)
        const combinationURL = `/sa/shuup_product_variations/${window.SHUUP_PRODUCT_VARIATIONS_DATA["product_id"]}/combinations/` 
        fetchCombinations(combinationURL);
    }, []);

    /*
        Help utils to get data that needs to be sent to server

    */
    const getMissingProductData = (variationData) => {
        const newProductData = []
        getCombinations(variationData, 0, [], {}).map((item, idx) => {
            let productId = getProductIdForCombination(state.productIdToCombinationMap, item);
            if (!productId) {
                let newSKUCombinationPart = Object.keys(item).map(k => `${k}-${item[k]}`).join('-').toLowerCase().replace(" ", "-");
                let newSKU = `${window.SHUUP_PRODUCT_VARIATIONS_DATA["default_sku"]}-${newSKUCombinationPart}`;
                newProductData.push({
                    "combination": item,
                    "product__sku": newSKU,
                    "default_price_value": window.SHUUP_PRODUCT_VARIATIONS_DATA["default_price"],
                    "stock_count": 0
                });
            }
        })
        return newProductData;
    }

    const getProductIdsToDelete = (variationData, newVariationData) => {
        const currentCombinations = getCombinations(variationData, 0, [], {})
        const newCombinations = getCombinations(newVariationData, 0, [], {})
        const productIdsToDelete = []
        currentCombinations.filter((item) => {
            let productId = getProductIdForCombination(state.productIdToCombinationMap, item);
            if (productId && !isCombinationInCombinations(item, newCombinations)) {
                productIdsToDelete.push(productId)
                return item;
            }
        })
        return productIdsToDelete;
    }

    /*
        Help utils to update the current state based on customer variation updates
    */
    const removeVariationSelect = (variable) => {
        const hasNewVariations = (Object.keys(state.newVariationData).length > 0);
        let newVariationData = (hasNewVariations ? state.newVariationData : {...state.variationData});
        delete newVariationData[variable];
        const newProductData = getMissingProductData(newVariationData);
        const productIdsToDelete = getProductIdsToDelete(state.variationData, newVariationData);
        if (newProductData.length === 0 && productIdsToDelete.length ===0) {
            // Here we have special case when the newVariationsData should be reset
            newVariationData = {};
        }
        return setState(prevState => { return { ...prevState, newVariationData, newProductData, productIdsToDelete } })
    }

    const addVariationSelectVariable = (selectedOption) => {
        const hasNewVariations = (Object.keys(state.newVariationData).length > 0);
        const newVariationData = (hasNewVariations ? state.newVariationData : {...state.variationData});
        const selectedValue = selectedOption.value;
        if (!Object.keys(newVariationData).includes(selectedValue)) {
            newVariationData[selectedValue] = []; 
        }
        return setState(prevState => { return { ...prevState, newVariationData } })
    }

    const updateVariationSelectValues = (variable, selectedOptions) => {
        const selectedVariableValues = selectedOptions.map(item => {return item.value})
        const hasNewVariations = (Object.keys(state.newVariationData).length > 0);
        let newVariationData = (hasNewVariations ? state.newVariationData : {...state.variationData});
        if (variable) {
            newVariationData[variable] = selectedVariableValues;
        }
        const newProductData = getMissingProductData(newVariationData)
        const productIdsToDelete = getProductIdsToDelete(state.variationData, newVariationData);
        if (newProductData.length === 0 && productIdsToDelete.length ===0) {
            // Here we have special case when the newVariationsData should be reset
            newVariationData = {}
        }
        return setState(prevState => { return { ...prevState, newVariationData, newProductData, productIdsToDelete } })
    }

    /*
        Send pending combinations to the application
    */
    const finalizePendingCombinations = () => {
        console.log("finalizing combinations")
        setState(prevState => { return { ...prevState, updating: true } })
        const data = {
            "new_combinations": state.newProductData,
            "product_ids_to_delete": state.productIdsToDelete
        }
        console.log(data);
        /*
            Notes:
              - Send combinations to server one by one but all the deletions on one try
              - Updating should likely disable all components but somehow show the progress all the time
              - I think when we are done here maybe we re-initialize the whole component and start the update process all over
        */
        return setState(prevState => { return { ...prevState, updating: false } })
    }

    /*
        Rendering the view for current state
    */
    if (state.loading) {
        return (
            <div className="flex-d flex-grow-1 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">{ gettext("Loading...") }</span>
                </div>
            </div>
        );
    } else if (state.organizing) {
        /*
            Here user can update the variation order, re-name and translate variations
            In most common situation this is already done by the marketplace admin

            Notes:
              - This will only change things for this product
              - This only available when there isn't any unconfirmed combination changes
        */
        return (
            <ProductVariationOrganizer
                productId={window.SHUUP_PRODUCT_VARIATIONS_DATA["product_id"]}
                onQuit={
                    () => {
                        setState(prevState => { return { ...prevState, organizing: false } })
                    }
                }
            />    
        );
    } else {
        /*
            List all combinations and allow user to update SKU, default price and inventory (optional)
        
            Notes:
              - Inventory is only available for stocked vendors
              - On top and bottom of combinations there is button for confirming combination changes
                which are pending because of some variation changes.
              - Customer has link to each combination to make further updates to the products sold
        */
        const hasNewVariations = (Object.keys(state.newVariationData).length > 0);
        const variationData = (hasNewVariations ? state.newVariationData : state.variationData);
        const hasAnyVariationsMissingValues = Object.keys(variationData).find((variable) => {
            return (variationData[variable].length === 0 ? true : false)
        });
        const SelectComponent = (window.SHUUP_PRODUCT_VARIATIONS_DATA["can_create"] ? CreatableSelect : Select);
        const variableOptions = Object.keys(state.preSavedVariationsData).filter((item) => {
            return !(Object.keys(variationData).includes(item));
        })

        /*
            Component for actions (shown on top and bottom of all product combinations)
        */
       let actionsComponent = null;
        if (!state.updating) {
            actionsComponent = (
                hasNewVariations ? (
                    <div>
                        <div className="d-flex flex-column m-3">
                            <button
                                className="btn btn-primary mb-4"
                                onClick={(e) => {
                                    e.preventDefault();
                                    finalizePendingCombinations();
                                }}
                            >
                                { gettext("Confirm pending changes to combinations") }
                            </button>
                        </div>
                        <div className="d-flex flex-column m-3">
                            <button
                                className="btn btn-primary btn-inverse mb-4"
                                onClick={(e) => {
                                    return setState(prevState => { return { ...prevState, newVariationData: {} } })
                                }}
                            >
                                { gettext("Cancel pending changes to combinations") }
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="d-flex flex-column m-3">
                        <button
                            className="btn btn-primary mb-4"
                            onClick={() => {setState(prevState => { return { ...prevState, organizing: true } })}}
                        >
                            { gettext("Organize current variations") }
                        </button>
                    </div>
                )
            );
        }
        return (
            <div>
                <h3>{ gettext("Add variations") }</h3>
                {  
                    Object.keys(variationData).map((variable, idx) => {
                        let values = variationData[variable];
                        let valueOptions = state.preSavedVariationsData[variable] || [];
                        return (
                            <div className="d-flex m-3 align-items-end" key={`pending-variations-${idx}`}>
                                <div className="d-flex flex-grow-1 flex-column">
                                    <h4 className="control-label">{ variable }</h4>
                                    <SelectComponent
                                        placeholder={ gettext("Select values for variable...") }
                                        isMulti
                                        onChange={(values) => {
                                            updateVariationSelectValues(variable, values);
                                        }}
                                        isDisabled={state.updating}
                                        value={values.map(item => {return {value: item, label: item}})}
                                        options={valueOptions.map(item => {return {value: item, label: item}})}
                                    />
                                </div>
                                {
                                    window.SHUUP_PRODUCT_VARIATIONS_DATA["can_edit"] ? (
                                        <div>
                                            <i
                                                className="fa fa-trash fa-2x align-self-center ml-4"
                                                onClick={() => {
                                                    removeVariationSelect(variable);
                                                }}
                                            ></i>
                                        </div>
                                    ) : (
                                        null
                                    )
                                }
                            </div>
                        );
                    })
                }
                {
                    window.SHUUP_PRODUCT_VARIATIONS_DATA["can_edit"] && !hasAnyVariationsMissingValues ? (
                        <div className="d-flex m-3" key={`pending-variations-new`}>
                            <SelectComponent
                                className="flex-grow-1 mr-1"
                                placeholder={ gettext("Add new variable...") }
                                onChange={(newValue) => {
                                    addVariationSelectVariable(newValue);
                                }}
                                isDisabled={state.updating}
                                value={null}
                                defaultValue={[]}
                                options={variableOptions.map(item => {return {value: item, label: item}})}
                            />
                        </div>
                    ) : (
                        null
                    )
                }
                {
                    hasAnyVariationsMissingValues ? (
                        <h3 className="mb-4">{ gettext("Make sure all variables has at least one value selected.") }</h3> 
                    ) : (
                        <div>
                            { actionsComponent }
                            {
                                Object.keys(variationData).length > 0 ? (
                                    <div className="d-flex flex-column m-3">
                                        <h3 className="mb-4">{ gettext("Product combinations") }</h3>
                                        {
                                            getCombinations(variationData, 0, [], {}).map((item, idx) => {
                                                let combinationStr = Object.keys(item).map(k => `${k}: ${item[k]}`).join(', ');
                                                let productId = getProductIdForCombination(state.productIdToCombinationMap, item);
                                                let data = {}
                                                if (productId) {
                                                    data = state.productData.find((item) => {return item["product_id"] === parseInt(productId, 10)});
                                                } else {
                                                    // We should find it from newProductData
                                                    data = getNewDataForCombination(state.newProductData, item)
                                                }
                                                const extraCSS = (idx % 2 ? "bg-light" : "");
                                                console.log(data)
                                                return (
                                                    <div className={`d-flex flex-column mb-3 ${extraCSS}`} key={`combination-${idx}`}>
                                                        <h4>{ combinationStr }</h4>
                                                        {
                                                            productId ? (
                                                                <CurrentVariable
                                                                    key={idx}
                                                                    productData={data}
                                                                    updating={state.updating}
                                                                    onSuccess={() => {
                                                                        console.log("lets refetch combinations")
                                                                        setState(prevState => { return { ...prevState, updating: true } })
                                                                        const combinationURL = `/sa/shuup_product_variations/${window.SHUUP_PRODUCT_VARIATIONS_DATA["product_id"]}/combinations/` 
                                                                        fetchCombinations(combinationURL);
                                                                    }}
                                                                />
                                                            ) : (
                                                                <NewVariable
                                                                    key={idx}
                                                                    productData={data}
                                                                    updating={state.updating}
                                                                    onUpdate={(newData) => {
                                                                        const newProductData = updateNewDataForCombination(state.newProductData, newData);
                                                                        return setState(prevState => { return { ...prevState, newProductData } })
                                                                    }}
                                                                />
                                                            )
                                                        }
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                ) : (
                                    null
                                )
                            }
                            { actionsComponent }
                        </div>
                    )
                }
            </div>
        )
    }
        
}

window.ProductVariationsApp = () => {
    ReactDOM.render(<App />, document.getElementById("product-variations-root"))
};
