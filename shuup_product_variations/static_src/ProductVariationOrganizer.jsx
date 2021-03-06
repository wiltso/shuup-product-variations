/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import VariationOrganizer from './VariationOrganizer';

const ProductVariationOrganizer = ({ productId, onQuit }) => (
  <div>
    <div className="d-flex flex-column m-3">
      <button
        type="button"
        className="btn btn-delete btn-inverse"
        onClick={() => { onQuit(); }}
      >
        { gettext('Go back to current product variations') }
      </button>
    </div>
    <VariationOrganizer
      variationsUrl={window.SHUUP_PRODUCT_VARIATIONS_DATA.variations_url.replace('xxxx', productId)}
      variableUrlTemplate={window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_url}
      variableValueUrlTemplate={window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_value_url}
      onError={() => { onQuit(); }}
    />
  </div>
);

export default ProductVariationOrganizer;
