/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import CurrentVariable from './CurrentVariable';
import NewVariable from './NewVariable';
import {
  getNewDataForCombination,
  getProductIdForCombination,
  updateNewDataForCombination,
} from './utils';

const getCombinationString = (combination) => (
  Object.keys(combination).map((k) => `${k}: ${combination[k]}`).join(', ')
);

const Combinations = ({
    combinations,
    variationData,
    productIdToCombinationMap,
    productData,
    newProductData,
    onNewDataUpdate
}) => {
  const [state, setState] = useState({
    visibleCombinations: [],
    productData,
    searchTerms: []
  });

  const getVisibleCombinations = () => {
    if (combinations.length > 200 || state.searchTerms.length > 0) {
      return combinations.filter((item) => {
        let combinationStr = getCombinationString(item)
        return (
          state.searchTerms.length > 0 &&
          state.searchTerms.every(searchTerm => (combinationStr.includes(searchTerm.value)))
        );
      })
    } else {
      return combinations;
    }
  }

  const getValueOptions = () => {
    return Object.keys(variationData).map((variationName) => {
      return variationData[variationName].map((value) => {
        return {variable: variationName, value: value};
      })
    })
  }

  useEffect(() => {
    setState((prevState) => ({ ...prevState, visibleCombinations: getVisibleCombinations() }));
  }, []);

  return (
    <div>
      <h3 className="mb-4">{ gettext('Product combinations') }</h3>
      <div className="d-flex flex-column m-3">
        <Select
          placeholder={gettext('Select values for combintations...')}
          isMulti
          onChange={(selected) => {
            return setState((prevState) => ({ ...prevState, searchTerms: selected || [] }));
          }}
          value={state.searchTerms}
          options={window._.flatten(getValueOptions()).map((item) => ({ value: item.value, label: `${item.variable}: ${item.value}` }))}
          form="combination-search-terms"
        />
      </div>
      {getVisibleCombinations().map((item, idx) => {
        const combinationStr = getCombinationString(item);
        const productId = getProductIdForCombination(productIdToCombinationMap, item);
        let data = {};
        if (productId) {
          data = state.productData.find((pData) => pData.product_id === parseInt(productId, 10));
        } else {
          // We should find it from newProductData
          data = getNewDataForCombination(newProductData, item);
        }
        const extraCSS = (idx % 2 ? 'bg-light' : '');
        return (
          <div className={`d-flex flex-column mb-3 ${extraCSS}`} key={`${combinationStr}-${newProductData.length}`}>
            <h4>{ combinationStr }</h4>
            {productId ? (
              <CurrentVariable
                productData={data}
                combination={item}
                updating={state.updating}
                onUpdateSuccess={() => {}}
              />
            ) : (
              <NewVariable
                productData={data}
                updating={state.updating}
                onUpdate={(newData) => {
                  return onNewDataUpdate(newData);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
export default Combinations;
