/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import {
  ensurePriceDecimalPlaces,
  ensureStockCountDecimalPlaces,
} from './utils';

const NewVariable = ({ productData, updating, onUpdate }) => {
  const [state, setState] = useState({
    productData: productData || {},
    onUpdate,
  });

  /*
    update skus through main state so the updated values are
    there when the actual update is finalized for these new items
  */
  function updateSku(event) {
    const newData = { ...state.productData };
    newData.sku = event.target.value;
    return setState((prevState) => ({ ...prevState, productData: newData }));
  }

  function updateDefaultPrice(event) {
    const newData = { ...state.productData };
    newData.price = ensurePriceDecimalPlaces(event.target.value.replace(',', '.'));
    return setState((prevState) => ({ ...prevState, productData: newData }));
  }

  function updateStockCount(event) {
    const newData = { ...state.productData };
    newData.stock_count = ensureStockCountDecimalPlaces(event.target.value.replace(',', '.'));
    return setState((prevState) => ({ ...prevState, productData: newData }));
  }

  /*
    render the actual row for this new item

    Note:
      - if main state is updating all these inputs shall be disabled
    */
  return (
    <div className="d-flex flex-row flex-grow-1 align-items-end">
      <div className="d-flex flex-column flex-grow-1">
        <small>{ gettext('SKU') }</small>
        <input
          type="text"
          className="form-control"
          value={state.productData.sku}
          onChange={(event) => updateSku(event)}
          onBlur={() => {
            const newProductData = { ...state.productData };
            newProductData.price = (newProductData.price === '' ? 0 : newProductData.price);
            newProductData.stock_count = (newProductData.stock_count === '' ? 0 : newProductData.stock_count);
            return state.onUpdate(newProductData);
          }}
          disabled={updating}
        />
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
          onChange={(event) => updateDefaultPrice(event)}
          onBlur={() => {
            const newProductData = { ...state.productData };
            newProductData.price = (newProductData.price === '' ? 0 : newProductData.price);
            newProductData.stock_count = (newProductData.stock_count === '' ? 0 : newProductData.stock_count);
            return state.onUpdate(newProductData);
          }}
          disabled={updating}
        />
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
            onChange={(event) => updateStockCount(event)}
            onBlur={() => {
              const newProductData = { ...state.productData };
              newProductData.price = (newProductData.price === '' ? 0 : newProductData.price);
              newProductData.stock_count = (newProductData.stock_count === '' ? 0 : newProductData.stock_count);
              return state.onUpdate(newProductData);
            }}
            disabled={updating}
          />
        </div>
      )}
    </div>
  );
};
export default NewVariable;
