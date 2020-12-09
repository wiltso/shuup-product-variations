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
import ProductVariationOrganizer from './ProductVariationOrganizer';
import VariationSelect from './VariationSelect';
import Combinations from './Combinations';
import {
  ensurePriceDecimalPlaces,
  ensureStockCountDecimalPlaces,
  getCombinations,
  getProductIdForCombination,
  isCombinationInCombinations,
  updateNewDataForCombination,
} from './utils';
import Client from './Client';


class CombinationOperationError extends Error {
  constructor(message, errors) {
    super(message);
    this.errors = errors;
  }
}

const deleteAllCombinations = (combinations) => (
  Client.request({
    url: window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url,
    method: 'DELETE',
    data: combinations,
  }).then((response) => {
    if (response.status === 200) {
      return Promise.resolve();
    }
    // TODO: get the errors
    const errors = [];
    return Promise.reject(
      new CombinationOperationError(gettext('Failed to delete combinations'), errors),
    );
  })
);

const createCombinations = (combinations) => Client.request({
  url: window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url,
  method: 'POST',
  data: combinations,
});

const CombinationsCreator = {
  createNextCombination(onFinish) {
    const that = this;
    if (this.combinationQueue.length === 0) {
      onFinish();
    } else {
      const combinations = this.combinationQueue.splice(0, 5);
      that.currentIndex += combinations.length;
      that.onUpdateProgress((that.currentIndex / this.totalToProcess) * 100.0);

      createCombinations(combinations).then(() => {
        that.createNextCombination(onFinish);
      }).catch((error) => {
        that.errors.push(error);
        that.createNextCombination(onFinish);
      });
    }
  },

  create(combinations, onUpdateProgress) {
    this.totalToProcess = combinations.length;
    this.errors = [];
    this.currentIndex = 0;
    this.onUpdateProgress = onUpdateProgress;
    this.combinationQueue = [...combinations];

    return new Promise((resolve, reject) => {
      this.createNextCombination(() => {
        const that = this;
        if (that.errors.length > 0) {
          reject(new CombinationOperationError(gettext('Failed to create combinations'), this.errors));
        } else {
          resolve();
        }
      });
    });
  },
};

const createAllCombinations = async (combinations, onUpdateProgress) => {
  // when we have more than 20 combinations, let's create them one by one
  onUpdateProgress(0); // 0%

  if (combinations.length > 20) {
    await CombinationsCreator.create(combinations, onUpdateProgress);
  } else {
    try {
      await createCombinations(combinations);
      onUpdateProgress(100); // 100%
    } catch (error) {
      // TODO: get all errors
      const errors = [error];
      throw new CombinationOperationError(gettext('Failed to delete combinations'), errors);
    }
  }
};

const ProductVariationsApp = () => {
  const [state, setState] = useState({

    // Some data for handling current state
    productIdToCombinationMap: {},
    productData: [],
    variationData: {},
    newVariationData: {},
    preSavedVariationsData: {},

    // Pending data data that needs to be sent to server
    newProductData: [],
    defaultPriceValue: ensurePriceDecimalPlaces(window.SHUUP_PRODUCT_VARIATIONS_DATA.default_price),
    defaultStockValue: 0,
    combinationsToDelete: [],

    // three different modes
    loading: true,
    updating: false,
    organizing: false,

    createProgress: 0,
  });

  /*
    Initialize the state
  */
  const fetchCombinations = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    const variationResults = data.combinations;
    const productData = data.product_data.map((item) => {
      return {
        ...item,
        price: ensurePriceDecimalPlaces(item.price),
        stock_count: ensureStockCountDecimalPlaces(item.stock_count)
      }
    });

    /*
      If for some reason child product we are currently at is not
      icluded in product data this means that we should immediately stop
      and head to parent product page.
     */
    if (window.SHUUP_PRODUCT_VARIATIONS_DATA.product_id !== window.SHUUP_PRODUCT_VARIATIONS_DATA.current_product_id) {
      const currentProductIdInData = variationResults.find((item) => {
        return item.product === window.SHUUP_PRODUCT_VARIATIONS_DATA.current_product_id;
      })
      console.log(currentProductIdInData)
      if (!currentProductIdInData) {
        window.location = window.SHUUP_PRODUCT_VARIATIONS_DATA.product_url;
      }
    }

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
        createProgress: 0,
      }));
    }
  };

  useEffect(() => {
    fetchCombinations(window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url);
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
          price: ensurePriceDecimalPlaces(state.defaultPriceValue),
          stock_count: ensureStockCountDecimalPlaces(state.defaultStockValue),
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
  const removeVariationSelect = (variableId, variableName) => {
    const hasNewVariations = (
      Object.keys(state.newVariationData).length > 0
      || state.combinationsToDelete.length > 0
    );
    let newVariationData = (hasNewVariations ? state.newVariationData : { ...state.variationData });
    delete newVariationData[variableName];
    const newProductData = getMissingProductData(newVariationData);
    const combinationsToDelete = getCombinationsToDelete(state.variationData, newVariationData);
    if (newProductData.length === 0 && combinationsToDelete.length === 0) {
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
    const selectedValue = selectedOption.label;
    if (!Object.keys(newVariationData).includes(selectedValue)) {
      newVariationData[selectedValue] = [];
    }
    return setState((prevState) => ({ ...prevState, newVariationData }));
  };

  const updateVariationSelectValues = (variableName, selectedOptions) => {
    const selectedVariableValues = selectedOptions.map((item) => item.label);
    const hasNewVariations = (
      Object.keys(state.newVariationData).length > 0
      || state.combinationsToDelete.length > 0
    );
    let newVariationData = (hasNewVariations ? state.newVariationData : { ...state.variationData });
    if (selectedVariableValues.length === 0) {
      delete newVariationData[variableName];
    } else {
      const adding = (newVariationData[variableName].length < selectedVariableValues.length);
      if (adding && selectedVariableValues.length > window.SHUUP_PRODUCT_VARIATIONS_DATA.max_values) {
        window.Messages.enqueue({
          text: gettext('Maximum variable values reached.'),
          tags: 'warning',
        });
      } else {
        newVariationData[variableName] = selectedVariableValues;
      }
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

  /*
      Send pending combinations to the application
  */
  const finalizePendingCombinations = async () => {
    setState((prevState) => ({
      ...prevState,
      updating: true,
      createProgress: 0,
    }));

    const stopUpdate = () => {
      setState((prevState) => ({...prevState, updating: true }));
      fetchCombinations(window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url);
    };

    // Delete old combinations
    if (state.combinationsToDelete.length) {
      const deleteCombinations = state.combinationsToDelete.map((comb) => ({ combination: comb }));
      try {
        await deleteAllCombinations(deleteCombinations);
      } catch (error) {
        if (error instanceof CombinationOperationError) {
          window.Messages.enqueue({ text: error.message, tags: 'error' });
          // TODO: handle
          console.log(error.errors);
        } else {
          console.error(error);
        }
        stopUpdate();
        return;
      }
    }

    if (state.newProductData) {
      try {
        await createAllCombinations(state.newProductData, (progress) => {
          setState((prevState) => ({
            ...prevState,
            createProgress: progress,
          }));
        });
        window.Messages.enqueue({
          text: gettext('Combinations created.'),
          tags: 'success',
        });
      } catch (error) {
        if (error instanceof CombinationOperationError) {
          window.Messages.enqueue({ text: error.message, tags: 'error' });
          // TODO: handle
          console.log(error.errors);
        } else {
          console.error(error);
        }
        stopUpdate();
      }
    }

    setState((prevState) => ({
      ...prevState,
      newVariationData: {},
      newProductData: [],
      combinationsToDelete: [],
    }));
    stopUpdate();
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

  /*
    Organize variations (at this point there isn't any pending changes)
  */
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
        onQuit={() => {return setState((prevState) => ({ ...prevState, organizing: false }))}}
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

  /*
      Component for actions (shown on top and bottom of all product combinations)
  */
  let actionsComponent = null;
  if (state.updating) {
    if (state.createProgress) {
      const progressPercentage = state.createProgress.toFixed(0);
      actionsComponent = (
        <div className="text-center m-3">
          <h3>{gettext('Creating variations...')}</h3>
          <p className="text-center text-warning">{gettext('Keep this page open to create all variations.')}</p>
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${progressPercentage}%`,
              }}
              aria-valuenow={progressPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {`${progressPercentage}%`}
            </div>
          </div>
        </div>
      );
    }
  } else if (hasNewVariations) {
    actionsComponent = (
      <div>
        <hr></hr>
        <div className="d-flex flex-column flex-grow-1 m-3">
          <small><strong>{ gettext('Default price value') }</strong></small>
          <input
            type="number"
            className="form-control"
            value={state.defaultPriceValue}
            onChange={(event) => {
              setState((prevState) => ({ ...prevState, updating: true }))
              const defaultPriceValue = ensurePriceDecimalPlaces(event.target.value);
              const newProductData = state.newProductData.map((item) => {
                return { ...item, price: defaultPriceValue}
              })
              return setState((prevState) => ({ ...prevState, newProductData, defaultPriceValue, updating: false }))
            }}
            disabled={state.updating}
          />
          <small>{ gettext('Changing this value updates the prices for all new combinations.') }</small>
        </div>
        <div className="d-flex flex-column flex-grow-1 m-3">
          <small><strong>{ gettext('Default stock count') }</strong></small>
          <input
            type="number"
            className="form-control"
            value={state.defaultStockValue}
            onChange={(event) => {
              setState((prevState) => ({ ...prevState, updating: true }))
              const defaultStockValue = ensureStockCountDecimalPlaces(event.target.value);
              const newProductData = state.newProductData.map((item) => {
                return { ...item, stock_count: defaultStockValue}
              })
              return setState((prevState) => ({ ...prevState, newProductData, defaultStockValue, updating: false }))
            }}
            disabled={state.updating}
          />
          <small>{ gettext('Changing this value updates the stocks for all new combinations.') }</small>
        </div>
        <div className="d-flex flex-column m-3 mb-4">
          <button
            type="button"
            className="btn btn-primary mb-1"
            onClick={(e) => {
              e.preventDefault();
              finalizePendingCombinations();
            }}
          >
            { gettext('Confirm pending changes to combinations') }
          </button>
          <small className="text-center">
            {gettext('After new combinations are confirmed you can do more editing for each new item.')}
          </small>
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
        <hr></hr>
      </div>
    );
  } else {
    actionsComponent = (
      <div className="d-flex flex-column m-3">
        <button
          type="button"
          className="btn btn-primary mb-4"
          onClick={() => setState((prevState) => ({ ...prevState, organizing: true }))}
        >
          { gettext('Organize current variations') }
        </button>
      </div>
    );
  }

  return (
    <div>
      <VariationSelect
        variationData={variationData}
        onAddVariable={addVariationSelectVariable}
        onChangeVariableValues={updateVariationSelectValues}
        onRemoveVariable={removeVariationSelect}
        allowAddNewVariable={
          window.SHUUP_PRODUCT_VARIATIONS_DATA.can_edit &&
          !hasAnyVariationsMissingValues &&
          !maxVariablesReached
        }
        canCreate={window.SHUUP_PRODUCT_VARIATIONS_DATA.can_create}
        allowEdit={window.SHUUP_PRODUCT_VARIATIONS_DATA.can_edit}
        forceDisabled={state.updating}
        variationsUrl={window.SHUUP_PRODUCT_VARIATIONS_DATA.default_variations_url}
      />
      {hasAnyVariationsMissingValues ? (
        <h3 className="mb-4">{ gettext('Make sure all variables has at least one value selected.') }</h3>
      ) : (
        <div>
          {actionsComponent}
          {Object.keys(variationData).length > 0 && (
            <div className="d-flex flex-column m-3">
              <Combinations
                combinations={getCombinations(variationData, 0, [], {})}
                variationData={variationData}
                productIdToCombinationMap={state.productIdToCombinationMap}
                productData={state.productData}
                newProductData={state.newProductData}
                onNewDataUpdate={(newData) => {
                const newestData = updateNewDataForCombination(state.newProductData, newData);
                return setState((prevState) => ({ ...prevState, newProductData: newestData }));
                }}
              />
            </div>
          )}
          {Object.keys(state.newVariationData).length > 0 && actionsComponent}
        </div>
      )}
    </div>
  );
};

export default ProductVariationsApp;
