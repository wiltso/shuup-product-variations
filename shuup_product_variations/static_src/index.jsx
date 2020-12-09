/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ReactDOM from 'react-dom';
import React from 'react';
import ProductVariationsApp from './ProductVariationsApp';
import OrganizerApp from './OrganizerApp';


window.ProductVariationsApp = () => {
  ReactDOM.render(<ProductVariationsApp />, document.getElementById('product-variations-root'));
};

window.ProductVariationsOrganizerApp = () => {
  ReactDOM.render(<OrganizerApp />, document.getElementById('product-variations-organizer-root'));
};
