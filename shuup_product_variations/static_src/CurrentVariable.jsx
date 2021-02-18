/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import Client from './Client';
import {
  ensurePriceDecimalPlaces,
  ensureStockCountDecimalPlaces,
} from './utils';

const CurrentVariable = ({
  combination,
  productData,
  updating,
  onUpdateSuccess,
}) => {
  const [state, setState] = useState({
    // statuses for sku input
    updatingSKU: false,
    skuUpdateError: '',
    skuUpdateSuccess: false,

    // statuses for default price input
    updatingDefaultPrice: false,
    defaultPriceUpdateError: '',
    defaultPriceUpdateSuccess: false,

    // statuses for stock count input
    updatingStockCount: false,
    stockCountUpdateError: '',
    stockCountUpdateSuccess: false,

    // current product data for the row
    changed: false,
    productData: productData || {},
  });

  /*
        change input values based on user inputs
    */
  function changeSKU(event) {
    const newData = { ...state.productData };
    const newValue = event.target.value;
    if (newData.sku !== newValue) {
      newData.sku = newValue;
      return setState((prevState) => ({
        ...prevState,
        productData: newData,
        changed: true,
      }));
    }
    return true;
  }

  function changeDefaultPrice(event) {
    const newData = { ...state.productData };
    const newValue = ensurePriceDecimalPlaces(event.target.value.replace(',', '.'));
    if (newData.price !== newValue) {
      newData.price = newValue;
      return setState((prevState) => ({
        ...prevState,
        productData: newData,
        changed: true,
      }));
    }
    return true;
  }

  function changeStockCount(event) {
    const newData = { ...state.productData };
    const newValue = ensureStockCountDecimalPlaces(event.target.value.replace(',', '.'));
    if (newData.stock_count !== newValue) {
      newData.stock_count = newValue;
      return setState((prevState) => ({
        ...prevState,
        productData: newData,
        changed: true,
      }));
    }
    return true;
  }

  function getURL() {
    return window.SHUUP_PRODUCT_VARIATIONS_DATA.combinations_url;
  }

  function getData() {
    return [{
      combination,
      sku: state.productData.sku,
      price: state.productData.price,
      stock_count: state.productData.stock_count,
    }];
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
    if (state.changed) {
      Client.post(getURL(), getData())
        .then((response) => {
          if (onUpdateSuccess) {
            onUpdateSuccess(response.data);
          }
          setState((prevState) => ({
            ...prevState,
            updatingSKU: false,
            skuUpdateError: '',
            skuUpdateSuccess: true,
            updatingDefaultPrice: false,
            defaultPriceUpdateError: '',
            defaultPriceUpdateSuccess: false,
            updatingStockCount: false,
            stockCountUpdateError: '',
            stockCountUpdateSuccess: false,
            changed: false,
          }));
        })
        .catch((error) => {
          let errorText = gettext('Updating SKU failed');
          if (error.response && error.response.data && error.response.data.error) {
            errorText = error.response.data.error;
          }

          if (window._.isObject(errorText)) {
            if (errorText.combinations) {
              errorText = errorText.combinations[0].sku;
            }
          }

          setState((prevState) => ({
            ...prevState,
            updatingSKU: false,
            skuUpdateError: errorText,
            skuUpdateSuccess: false,
            updatingDefaultPrice: false,
            defaultPriceUpdateError: '',
            defaultPriceUpdateSuccess: false,
            updatingStockCount: false,
            stockCountUpdateError: '',
            stockCountUpdateSuccess: false,
            changed: false,
          }));
        });

      return setState((prevState) => ({
        ...prevState,
        updatingSKU: true,
      }));
    }
    return true;
  }

  function updateDefaultPrice() {
    if (state.changed) {
      Client.post(getURL(), getData())
        .then((response) => {
          if (onUpdateSuccess) {
            onUpdateSuccess(response.data);
          }
          setState((prevState) => ({
            ...prevState,
            updatingSKU: false,
            skuUpdateError: '',
            skuUpdateSuccess: false,
            updatingDefaultPrice: false,
            defaultPriceUpdateError: '',
            defaultPriceUpdateSuccess: true,
            updatingStockCount: false,
            stockCountUpdateError: '',
            stockCountUpdateSuccess: false,
            changed: false,
          }));
        })
        .catch((error) => {
          let errorText = gettext('Updating price failed');
          if (error.response && error.response.data && error.response.data.error) {
            errorText = error.response.data.error;
          }

          if (window._.isObject(errorText)) {
            if (errorText.combinations) {
              errorText = errorText.combinations[0].price;
            }
          }

          setState((prevState) => ({
            ...prevState,
            updatingSKU: false,
            skuUpdateError: '',
            skuUpdateSuccess: false,
            updatingDefaultPrice: false,
            defaultPriceUpdateError: errorText,
            defaultPriceUpdateSuccess: false,
            updatingStockCount: false,
            stockCountUpdateError: '',
            stockCountUpdateSuccess: false,
            changed: false,
          }));
        });
      return setState((prevState) => ({
        ...prevState,
        updatingDefaultPrice: true,
      }));
    }
    return true;
  }

  function updateStockCount() {
    if (state.changed) {
      Client.post(getURL(), getData())
        .then((response) => {
          if (onUpdateSuccess) {
            onUpdateSuccess(response.data);
          }
          setState((prevState) => ({
            ...prevState,
            updatingSKU: false,
            skuUpdateError: '',
            skuUpdateSuccess: false,
            updatingDefaultPrice: false,
            defaultPriceUpdateError: '',
            defaultPriceUpdateSuccess: false,
            updatingStockCount: false,
            stockCountUpdateError: '',
            stockCountUpdateSuccess: true,
            changed: false,
          }));
        })
        .catch((error) => {
          let errorText = gettext('Updating price failed');
          if (error.response && error.response.data && error.response.data.error) {
            errorText = error.response.data.error;
          }

          if (window._.isObject(errorText)) {
            if (errorText.combinations) {
              errorText = errorText.combinations[0].stock_count;
            }
          }

          setState((prevState) => ({
            ...prevState,
            updatingSKU: false,
            skuUpdateError: '',
            skuUpdateSuccess: false,
            updatingDefaultPrice: false,
            defaultPriceUpdateError: '',
            defaultPriceUpdateSuccess: false,
            updatingStockCount: false,
            stockCountUpdateError: errorText,
            stockCountUpdateSuccess: false,
            changed: false,
          }));
        });

      return setState((prevState) => ({
        ...prevState,
        updatingStockCount: true,
      }));
    }
    return true;
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
    <small className="text-warning">{ gettext('Updating...') }</small>
  );
  const updateSuccessElement = (
    <small className="text-success">{ gettext('Updated!') }</small>
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

  if (!productData) return null;

  /*
        render the actual row
    */
  const productUrlTemplate = window.SHUUP_PRODUCT_VARIATIONS_DATA.product_url_template;
  return (
    <div className="d-flex flex-row flex-grow-1 align-items-end">
      <div className="d-flex flex-column flex-grow-1">
        <small>{ gettext('SKU') }</small>
        <input
          type="text"
          className="form-control"
          value={state.productData.sku}
          onChange={changeSKU}
          onBlur={updateSKU}
          disabled={disableInputs || state.defaultPriceUpdateError || state.stockCountUpdateError}
        />
        { skuHelpText }
      </div>
      <div className="d-flex flex-column flex-grow-1 ml-1 mr-1">
        <small>
          { gettext('Default Price') }
          { ' (' + window.SHUUP_PRODUCT_VARIATIONS_DATA.currency + ') ' }
        </small>
        <input
          type="number"
          className="form-control"
          value={state.productData.price}
          onChange={changeDefaultPrice}
          onBlur={updateDefaultPrice}
          disabled={disableInputs || state.skuUpdateError || state.stockCountUpdateError}
        />
        { defaultPriceHelpText }
      </div>
      {window.SHUUP_PRODUCT_VARIATIONS_DATA.stock_managed && (
        <div className="d-flex flex-column flex-grow-1">
          <small>
            { gettext('Inventory') }
            { ' (' + window.SHUUP_PRODUCT_VARIATIONS_DATA.sales_unit + ') ' }
          </small>
          <input
            type="number"
            className="form-control"
            value={state.productData.stock_count}
            onChange={changeStockCount}
            onBlur={updateStockCount}
            disabled={disableInputs || state.skuUpdateError || state.defaultPriceUpdateError}
          />
          { stockCountHelpText }
        </div>
      )}
      <div className="d-flex flex-column align-items-end">
        <a href={productUrlTemplate.replace('xxxx', state.productData.pk) + '#product-variations-section'}>
          <i className="fa fa-edit fa-2x align-self-center ml-2" />
        </a>
        <small className="text-info align-self-center">{ gettext('Edit') }</small>
      </div>
    </div>
  );
};

export default CurrentVariable;
