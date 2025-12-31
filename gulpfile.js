/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

const { src, dest, task } = require('gulp');

task('build:icons', function () {
  return src('nodes/**/*.{png,svg}').pipe(dest('dist/nodes'));
});

task('default', task('build:icons'));
