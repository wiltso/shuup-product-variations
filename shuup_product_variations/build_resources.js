/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { getParcelBuildCommand, runBuildCommands } = require('shuup-static-build-tools');

runBuildCommands([
  getParcelBuildCommand({
    cacheDir: 'shuup_product_variations',
    outputDir: 'static/shuup_product_variations/',
    entryFile: 'static_src/index.jsx',
    outputFileName: 'shuup_product_variations',
  }),
]);
