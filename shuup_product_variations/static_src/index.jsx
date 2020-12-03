/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import CurrentVariable from './CurrentVariable';
import NewVariable from './NewVariable';
import ProductVariationOrganizer from './ProductVariationOrganizer';
import {
  getCombinations,
  getNewDataForCombination,
  getProductIdForCombination,
  isCombinationInCombinations,
  updateNewDataForCombination,
} from './utils';
import Client from './Client';

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
    combinationsToDelete: [],

    // three different modes
    loading: false,
    updating: false,
    organizing: false,

    createProgress: 0,
  });

  /*
        Initialize the state
    */
  const fetchCombinations = async (url) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      const variationResults = data.combinations;
      const productData = data.product_data;
      const variationData = {};
      const productIdToCombinationMap = {};
      if (variationResults) {
        variationResults.forEach((item) => {
          const { combination } = item;
          if (item.product) {
            productIdToCombinationMap[item.product] = combination;
          }

          Object.keys(combination).forEach((variable) => {
            const value = combination[variable];
            if (variationData[variable] === undefined) {
              variationData[variable] = [value];
            } else if (!variationData[variable].includes(value)) {
              variationData[variable].push(value);
            }
          });
        });
        setState((prevState) => ({
          ...prevState,
          productIdToCombinationMap,
          productData,
          variationData,
          loading: false,
          updating: false,
        }));
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
      const preSavedVariationsData = data.variations || {};
      setState((prevState) => ({
        ...prevState,
        preSavedVariationsData,
      }));
    } catch {
      // setError(true);
    } finally {
      // setLoading(false);
    }
  };
  useEffect(() => {
    setState((prevState) => ({ ...prevState, loading: true }));
    const variationURL = window.SHUUP_PRODUCT_VARIATIONS_DATA.product_variations_url;
    fetchVariations(variationURL);
    const combinationURL = window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url;
    fetchCombinations(combinationURL);
  }, []);

  /*
     Help utils to get data that needs to be sent to server
    */
  const getMissingProductData = (variationData) => {
    const newProductData = [];
    getCombinations(variationData, 0, [], {}).forEach((item) => {
      const productId = getProductIdForCombination(state.productIdToCombinationMap, item);
      if (!productId) {
        const newSKUCombinationPart = Object.keys(item).map((k) => `${k}-${item[k]}`).join('-').toLowerCase()
          .replace(' ', '-');
        const newSKU = `${window.SHUUP_PRODUCT_VARIATIONS_DATA.default_sku}-${newSKUCombinationPart}`;
        newProductData.push({
          combination: item,
          sku: newSKU,
          price: window.SHUUP_PRODUCT_VARIATIONS_DATA.default_price,
          stock_count: 0,
        });
      }
    });
    return newProductData;
  };

  const getCombinationsToDelete = (variationData, newVariationData) => {
    const currentCombinations = getCombinations(variationData, 0, [], {});
    const newCombinations = getCombinations(newVariationData, 0, [], {});
    return currentCombinations.filter((item) => {
      const productId = getProductIdForCombination(state.productIdToCombinationMap, item);
      return (productId && !isCombinationInCombinations(item, newCombinations));
    });
  };

  /*
      Help utils to update the current state based on customer variation updates
    */
  const removeVariationSelect = (variable) => {
    const hasNewVariations = (
      Object.keys(state.newVariationData).length > 0
      || state.combinationsToDelete.length > 0
    );
    let newVariationData = (hasNewVariations ? state.newVariationData : { ...state.variationData });
    delete newVariationData[variable];
    const newProductData = getMissingProductData(newVariationData);
    const combinationsToDelete = getCombinationsToDelete(state.variationData, newVariationData);
    if (combinationsToDelete.length === 0) {
      // Here we have special case when the newVariationsData should be reset
      newVariationData = {};
    }
    return setState((prevState) => ({
      ...prevState, newVariationData, newProductData, combinationsToDelete,
    }));
  };

  const addVariationSelectVariable = (selectedOption) => {
    const hasNewVariations = (
      Object.keys(state.newVariationData).length > 0
      || state.combinationsToDelete.length > 0
    );
    const newVariationData = (hasNewVariations ? state.newVariationData : { ...state.variationData });
    const selectedValue = selectedOption.value;
    if (!Object.keys(newVariationData).includes(selectedValue)) {
      newVariationData[selectedValue] = [];
    }
    return setState((prevState) => ({ ...prevState, newVariationData }));
  };

  const updateVariationSelectValues = (variable, selectedOptions) => {
    const selectedVariableValues = selectedOptions.map((item) => item.value);
    const hasNewVariations = (
      Object.keys(state.newVariationData).length > 0
      || state.combinationsToDelete.length > 0
    );
    let newVariationData = (hasNewVariations ? state.newVariationData : { ...state.variationData });
    if (variable) {
      newVariationData[variable] = selectedVariableValues;
    }
    const newProductData = getMissingProductData(newVariationData);
    const combinationsToDelete = getCombinationsToDelete(state.variationData, newVariationData);
    if (newProductData.length === 0 && combinationsToDelete.length === 0) {
      // Here we have special case when the newVariationsData should be reset
      newVariationData = {};
    }
    return setState((prevState) => ({
      ...prevState,
      newVariationData,
      newProductData,
      combinationsToDelete,
    }));
  };

  const createCombinations = (combinations) => {
    const parentProductId = window.SHUUP_PRODUCT_VARIATIONS_DATA.product_id;
    return Client.request({
      url: `/sa/shuup_product_variations/${parentProductId}/combinations/`,
      method: 'POST',
      data: combinations,
    });
  };

  const createAllCombinations = (combinations) => (
    // when we have more than 30 combinations, let's create them one by one
    new Promise((resolve, reject) => {
      if (combinations.length > 30) {
        combinations.forEach(async (combination) => {
          try {
            await createCombinations([combination]);
          } catch (error) {

          }
        });
      } else {
        resolve(createCombinations(combinations));
      }
    })
  );

  /*
      Send pending combinations to the application
  */
  const finalizePendingCombinations = async () => {
    setState((prevState) => ({
      ...prevState,
      updating: true,
      createProgress: 0,
    }));

    const parentProductId = window.SHUUP_PRODUCT_VARIATIONS_DATA.product_id;

    const stopUpdate = () => {
      setState((prevState) => ({
        ...prevState,
        updating: false,
      }));
    };

    // Delete old combinations
    if (state.combinationsToDelete.length) {
      const deletePayload = state.combinationsToDelete.map((comb) => ({ combination: comb }));
      try {
        const response = await Client.request({
          url: `/sa/shuup_product_variations/${parentProductId}/combinations/`,
          method: 'DELETE',
          data: deletePayload,
        });
        if (response.status === 200) {
          window.Messages.enqueue({
            text: gettext('Old combinations deleted.'),
            tags: 'success',
          });
        } else {
          window.Messages.enqueue({
            text: gettext('Failed to delete old combinations'),
            tags: 'error',
          });
          stopUpdate();
          return;
        }
      } catch (error) {
        window.Messages.enqueue({
          text: gettext('Failed to delete old combinations'),
          tags: 'error',
        });
        stopUpdate();
        return;
      }
    }
    if (state.newProductData) {
      createAllCombinations(state.newProductData).then(() => {
        window.Messages.enqueue({
          text: gettext('Combinations created.'),
          tags: 'success',
        });
        stopUpdate();
      }).catch(() => {
        window.Messages.enqueue({
          text: gettext('Failed to create combinations.'),
          tags: 'error',
        });
        stopUpdate();
      });
    } else {
      stopUpdate();
    }
  };

  /*
        Rendering the view for current state
    */
  if (state.loading) {
    return (
      <div className="flex-d flex-grow-1 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{ gettext('Loading...') }</span>
        </div>
      </div>
    );
  }
  if (state.organizing) {
    /*
      Here user can update the variation order, re-name and translate variations
      In most common situation this is already done by the marketplace admin

      Notes:
        - This will only change things for this product
        - This only available when there isn't any unconfirmed combination changes
    */
    return (
      <ProductVariationOrganizer
        productId={window.SHUUP_PRODUCT_VARIATIONS_DATA.product_id}
        onQuit={() => setState((prevState) => ({ ...prevState, organizing: false }))}
      />
    );
  }
  /*
    List all combinations and allow user to update SKU, default price and inventory (optional)

    Notes:
      - Inventory is only available for stocked vendors
      - On top and bottom of combinations there is button for confirming combination changes
        which are pending because of some variation changes.
      - Customer has link to each combination to make further updates to the products sold
  */
  const hasNewVariations = (
    Object.keys(state.newVariationData).length > 0
    || state.combinationsToDelete.length > 0
  );
  const variationData = (hasNewVariations ? state.newVariationData : state.variationData);
  const hasAnyVariationsMissingValues = Object.keys(variationData).find((variable) => (variationData[variable].length === 0));
  const maxVariablesReached = (Object.keys(variationData).length > (window.SHUUP_PRODUCT_VARIATIONS_DATA.max_variations - 1));
  const SelectComponent = (window.SHUUP_PRODUCT_VARIATIONS_DATA.can_create ? CreatableSelect : Select);
  const variableOptions = Object.keys(state.preSavedVariationsData).filter((item) => !(Object.keys(variationData).includes(item)));

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
              type="button"
              className="btn btn-primary mb-4"
              onClick={(e) => {
                e.preventDefault();
                finalizePendingCombinations();
              }}
            >
              { gettext('Confirm pending changes to combinations') }
            </button>
          </div>
          <div className="d-flex flex-column m-3">
            <button
              type="button"
              className="btn btn-primary btn-inverse mb-4"
              onClick={() => setState((prevState) => ({ ...prevState, newVariationData: {} }))}
            >
              { gettext('Cancel pending changes to combinations') }
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column m-3">
          <button
            type="button"
            className="btn btn-primary mb-4"
            onClick={() => setState((prevState) => ({ ...prevState, organizing: true }))}
          >
            { gettext('Organize current variations') }
          </button>
        </div>
      )
    );
  }
  return (
    <div>
      <h3>{ gettext('Add variations') }</h3>
      {Object.keys(variationData).map((variable, idx) => {
        const values = variationData[variable];
        const valueOptions = state.preSavedVariationsData[variable] || [];
        return (
          <div className="d-flex m-3 align-items-end" key={`pending-variations-${idx}`}>
            <div className="d-flex flex-grow-1 flex-column">
              <h4 className="control-label">{ variable }</h4>
              <SelectComponent
                placeholder={gettext('Select values for variable...')}
                isMulti
                onChange={(selected) => {
                  updateVariationSelectValues(variable, selected);
                }}
                isDisabled={!window.SHUUP_PRODUCT_VARIATIONS_DATA.can_edit || state.updating}
                value={values.map((item) => ({ value: item, label: item }))}
                options={valueOptions.map((item) => ({ value: item, label: item }))}
                form="new-variable-value-form"
              />
            </div>
            {window.SHUUP_PRODUCT_VARIATIONS_DATA.can_edit && (
              <div>
                <i
                  className="fa fa-trash fa-2x align-self-center ml-4"
                  onClick={() => {
                    removeVariationSelect(variable);
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      {(window.SHUUP_PRODUCT_VARIATIONS_DATA.can_edit && !hasAnyVariationsMissingValues && !maxVariablesReached) && (
        <div className="d-flex m-3" key="pending-variations-new">
          <SelectComponent
            className="flex-grow-1 mr-1"
            placeholder={gettext('Add new variable...')}
            onChange={(newValue) => {
              addVariationSelectVariable(newValue);
            }}
            isDisabled={state.updating}
            value={null}
            defaultValue={[]}
            options={variableOptions.map((item) => ({ value: item, label: item }))}
            form="new-variable-form"
          />
        </div>
      )}
      {hasAnyVariationsMissingValues ? (
        <h3 className="mb-4">{ gettext('Make sure all variables has at least one value selected.') }</h3>
      ) : (
        <div>
          {actionsComponent}
          {Object.keys(variationData).length > 0 && (
            <div className="d-flex flex-column m-3">
              <h3 className="mb-4">{ gettext('Product combinations') }</h3>
              {getCombinations(variationData, 0, [], {}).map((item, idx) => {
                const combinationStr = Object.keys(item).map((k) => `${k}: ${item[k]}`).join(', ');
                const productId = getProductIdForCombination(state.productIdToCombinationMap, item);
                let data = {};
                if (productId) {
                  data = state.productData.find((pData) => pData.product_id === parseInt(productId, 10));
                } else {
                  // We should find it from newProductData
                  data = getNewDataForCombination(state.newProductData, item);
                }
                const extraCSS = (idx % 2 ? 'bg-light' : '');
                return (
                  <div className={`d-flex flex-column mb-3 ${extraCSS}`} key={`combination-${idx}`}>
                    <h4>{ combinationStr }</h4>
                    {productId ? (
                      <CurrentVariable
                        key={idx}
                        productData={data}
                        combination={item}
                        updating={state.updating}
                        onSuccess={() => {
                          setState((prevState) => ({ ...prevState, updating: true }));
                          const combinationURL = window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url;
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
                          return setState((prevState) => ({ ...prevState, newProductData }));
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {Object.keys(state.newVariationData).length > 0 && actionsComponent}
        </div>
      )}
    </div>
  );
};

window.ProductVariationsApp = () => {
  ReactDOM.render(<App />, document.getElementById('product-variations-root'));
};
