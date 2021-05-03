/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
 *
 * This source code is licensed under the Shuup Commerce Inc -
 * SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
 * and the Licensee.
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
