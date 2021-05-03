/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
 *
 * This source code is licensed under the Shuup Commerce Inc -
 * SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
 * and the Licensee.
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
