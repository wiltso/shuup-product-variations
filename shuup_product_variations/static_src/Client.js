/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import axios from 'axios';

const Client = axios.create({
  timeout: 30000, // 30 secs
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  maxRedirects: 0, // never redirect, otherwise the JWT won't be passed through
});

export default Client;
