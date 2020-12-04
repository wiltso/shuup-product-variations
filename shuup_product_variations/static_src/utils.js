/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
export function getCombinations(options, optionIndex, results, current) {
  const allKeys = Object.keys(options);
  if (allKeys.length) {
    const optionKey = allKeys[optionIndex];
    const vals = options[optionKey];
    if (!vals) {
      return results;
    }

    for (let i = 0; i < vals.length; i += 1) {
      current[optionKey] = vals[i];
      if (optionIndex + 1 < allKeys.length) {
        getCombinations(options, optionIndex + 1, results, current);
      } else {
        const res = JSON.parse(JSON.stringify(current));
        results.push(res);
      }
    }
  }
  return results;
}

export function getNewDataForCombination(combinationToData, combination) {
  if (combinationToData.length > 0) {
    return combinationToData.find((item) => window._.isEqual(item.combination, combination));
  }
  return {
    sku: '',
    stock_count: 0,
    price: 0,
  };
}

export function updateNewDataForCombination(combinationToData, data) {
  const { combination } = data;
  const dataItem = getNewDataForCombination(combinationToData, combination);
  if (dataItem) {
    dataItem.sku = data.sku;
    dataItem.price = data.price;
    dataItem.stock_count = data.stock_count;
  }
  return combinationToData;
}

export function getProductIdForCombination(productIdToCombinationMap, combination) {
  if (productIdToCombinationMap) {
    return Object.keys(productIdToCombinationMap)
      .filter((key) => !!key)
      .find((key) => window._.isEqual(productIdToCombinationMap[key], combination));
  }
  return null;
}

export function isCombinationInCombinations(combination, combinations) {
  return combinations.find((item) => window._.isEqual(combination, item));
}

function countDecimals(value) {
  if (value.toString().split('.').length < 2) {
    return 0;
  }
  if (Math.floor(value) === value) {
    return 0;
  }
  return value.toString().split('.')[1].length || 0;
}

function round(value, decimalPlaces) {
  return Number(value).toFixed(decimalPlaces);
}

export function ensureDecimalPlaces(value) {
  if (countDecimals(value) > window.SHUUP_PRODUCT_VARIATIONS_DATA.currency_decimal_places) {
    return round(value, window.SHUUP_PRODUCT_VARIATIONS_DATA.currency_decimal_places);
  }
  return value;
}
