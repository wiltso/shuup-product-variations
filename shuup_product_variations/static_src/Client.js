/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
 *
 * This source code is licensed under the Shuup Commerce Inc -
 * SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
 * and the Licensee.
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
