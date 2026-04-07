'use strict';

const gulp = require('gulp');
const colors = require('ansi-colors');
const log = require('fancy-log');
const gulpTypescript = require('gulp-typescript');
const through2 = require('through2');
const rename = require('gulp-rename');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const fs = require('fs');

// TypeScript project (reads tsconfig.json)
const tsProject = gulpTypescript.createProject('tsconfig.json');

const { version } = require('./package.json');

const decorator = [
  '/**',
  '----',
  '*',
  `* Highcharts Ternary Plot v${version}`,
  '*',
  '* (c) 2012-2026 Black Label, Rafał Sebestjański',
  '*',
  '* License: MIT',
  '*/',
  ''
];

// Step 1: Compile TS → JS (no wrapping yet)
gulp.task('tsc', () => {
  return gulp.src('ts/**/*.ts')
    .pipe(tsProject())
    .js
    .pipe(rename('ternary-plot.js'))
    .pipe(gulp.dest('.cache/tmp')); });

// Step 2: Wrap into UMD
gulp.task('wrap', () => {
  return gulp.src('.cache/tmp/ternary-plot.js')
    .pipe(through2.obj(function (file, _encoding, callback) {
      if (file.isBuffer()) {
        let fileContent = file.contents.toString('utf8');

        // Strip ES imports/exports (keep function declarations)
        fileContent = fileContent
          .replace(/import (.+?) from ["'](.+?)["'];/g, '')
          .replace(/import ["'](.+?)["'];/g, '')
          .replace(/export default function TernaryPlotPlugin/g, 'function TernaryPlotPlugin')
          .replace(/export function /g, 'function ');

        // UMD wrapper
        const wrappedFileContent = decorator.join('\n') +
`(function (factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
  } else {
    factory(Highcharts);
  }
}(function (Highcharts) {
${fileContent}
TernaryPlotPlugin(Highcharts);
}));`;

        file.contents = Buffer.from(wrappedFileContent, 'utf8');
      }
      this.push(file);
      callback();
    }))
    .pipe(gulp.dest('js'));
});

// Lint task using modern ESLint
gulp.task('lint', async () => {
  try {
    const { stdout, stderr } = await execAsync('npx eslint ts/**/*.ts');
    if (stdout) log(stdout);
    if (stderr) log(stderr);
    log(colors.green('✓ ESLint passed'));
  } catch (error) {
    log(colors.red('✗ ESLint failed'));
    if (error.stdout) log(error.stdout);
    if (error.stderr) log(error.stderr);
    throw error;
  }
});

// Clean up temporary files
gulp.task('clean', (done) => {
  if (fs.existsSync('.cache/tmp')) {
    fs.rmSync('.cache/tmp', { recursive: true, force: true });
  }
  log(colors.green('✓ Cleaned temp files'));
  done();
});

// Combined build (lint → tsc → wrap → clean)
gulp.task('build', gulp.series('lint', 'tsc', 'wrap', 'clean'));

// Watch (skip lint for speed)
gulp.task('watch', () => gulp.watch('ts/**/*.ts', gulp.series('tsc', 'wrap')));

// Default task help
gulp.task('default', (done) => {
	log([
		'\n',
		colors.yellow('TASKS:'),
		colors.cyan('build    :') + ' lint, compile TS, and wrap in UMD',
		colors.cyan('tsc      :') + ' compile TS only (no wrapping)',
		colors.cyan('wrap     :') + ' wrap compiled JS in UMD',
		colors.cyan('watch    :') + ' watch TS files, recompile + wrap',
		''
	].join('\n'));
	done();
});