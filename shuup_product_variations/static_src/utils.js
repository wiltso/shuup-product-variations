/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
export function getCombinations(options, optionIndex, results, current) {
    var allKeys = Object.keys(options);
    var optionKey = allKeys[optionIndex];
    var vals = options[optionKey];
    for (var i = 0; i < vals.length; i++) {
        current[optionKey] = vals[i];
        if (optionIndex + 1 < allKeys.length) {
            getCombinations(options, optionIndex + 1, results, current);
        } else {
            var res = JSON.parse(JSON.stringify(current));
            results.push(res);
        }
    }
    return results;
}

export function getNewDataForCombination(combinationToData, combination) {
    if (combinationToData.length > 0) {
        return combinationToData.find((item) => {
            return window._.isEqual(item["combination"], combination);
        })
    }
}

export function updateNewDataForCombination(combinationToData, data) {
    const combination = data["combination"]
    let dataItem = getNewDataForCombination(combinationToData, combination);
    if (dataItem) {
        dataItem["product__sku"] = data["product__sku"]
        dataItem["default_price_value"] = data["default_price_value"]
        dataItem["stock_count"] = data["stock_count"]
    }
    return combinationToData;
}

export function getProductIdForCombination(productIdToCombinationMap, combination) {
    if (productIdToCombinationMap) {
        return Object.keys(productIdToCombinationMap).find((key) => {
            return window._.isEqual(productIdToCombinationMap[key], combination);
        })
    }
}

export function isCombinationInCombinations(combination, combinations) {
    return combinations.find((item) => {
        return window._.isEqual(combination, item);
    })
}

function countDecimals(value) {
    if (value.toString().split(".").length < 2) {
        return 0;
    }
    if (Math.floor(value) === value) {
        return 0;
    }
    return value.toString().split(".")[1].length || 0; 
}

function round(value, decimal_places) {
    return Number(value).toFixed(decimal_places)
}

export function ensureDecimalPlaces(value) {
    if (countDecimals(value) > window.SHUUP_PRODUCT_VARIATIONS_DATA.currency_decimal_places) {
        return round(value, window.SHUUP_PRODUCT_VARIATIONS_DATA.currency_decimal_places)
    }
    return value
}
