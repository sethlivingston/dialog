var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var to5 = require('gulp-babel');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var es = require('event-stream');
var through2 = require('through2');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var rename = require('gulp-rename');
var tools = require('aurelia-tools');
var del = require('del');
var vinylPaths = require('vinyl-paths');

var jsName = paths.packageName + '.js';

gulp.task('build-index', function(){
  var importsToAdd = [];
  var files = [
    'ai-dialog-body.js',
    'ai-dialog-footer.js',
    'ai-dialog-header.js',
    'ai-dialog.js',
    'attach-focus.js',
    'dialog-controller.js',
    'dialog-renderer.js',
    'dialog-service.js',
    'lifecycle.js'
    ].map(function(file){
      return paths.root + file;
    });

  return gulp.src(files)
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), importsToAdd));
      this.push(file);
      return callback();
    }))
    .pipe(concat(jsName))
    .pipe(insert.transform(function(contents) {
      return tools.createImportBlock(importsToAdd) + contents;
    }))
    .pipe(gulp.dest(paths.output));
});

gulp.task('build-html-es6', function () {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.output + 'es6'));
});

gulp.task('build-es6-temp', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'common'})))
    .pipe(gulp.dest(paths.output + 'temp'));
});

gulp.task('build-es6', ['build-html-es6'], function () {
  return gulp.src(paths.source)
    .pipe(gulp.dest(paths.output + 'es6'));
});

gulp.task('build-commonjs', ['build-html-commonjs'], function () {
  return gulp.src(paths.source)
    .pipe(to5(assign({}, compilerOptions, {modules:'common', plugins: []})))
    .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-amd', ['build-html-amd'], function () {
  return gulp.src(paths.source)
    .pipe(to5(assign({}, compilerOptions, {modules:'amd', plugins: []})))
    .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build-system', ['build-html-system'], function () {
  return gulp.src(paths.source)
    .pipe(to5(assign({}, compilerOptions, {modules:'system', plugins: []})))
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build-html-commonjs', function () {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-html-amd', function () {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build-html-system', function () {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build-dts', function(){
  return gulp.src(paths.output + paths.packageName + '.d.ts')
    .pipe(rename(paths.packageName + '.d.ts'))
    .pipe(gulp.dest(paths.output + 'es6'))
    .pipe(gulp.dest(paths.output + 'commonjs'))
    .pipe(gulp.dest(paths.output + 'amd'))
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build-css', function () {
  var lessSettings = { paths: [paths.root] };

  return gulp.src(paths.less)
    .pipe(less(lessSettings))
    .pipe(gulp.dest(paths.styleFolder));
});

gulp.task('minifyCSS', function () {
    var amdCSS = gulp.src(paths.style)
     .pipe(minifyCSS({ keepBreaks: false }))
     .pipe(gulp.dest(paths.output+"amd"));

    var sysCSS = gulp.src(paths.style)
     .pipe(minifyCSS({ keepBreaks: false }))
     .pipe(gulp.dest(paths.output+"system"));

    var commonCSS = gulp.src(paths.style)
     .pipe(minifyCSS({ keepBreaks: false }))
     .pipe(gulp.dest(paths.output+"commonjs"));

     var es6CSS = gulp.src(paths.style)
     .pipe(minifyCSS({ keepBreaks: false }))
     .pipe(gulp.dest(paths.output+"es6"));

    return es.concat(amdCSS,sysCSS,commonCSS,es6CSS);
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-index',
    ['build-es6-temp', 'build-commonjs', 'build-amd', 'build-system', 'build-es6', 'build-css'],
    'minifyCSS',
    'build-dts',
    callback
  );
});
