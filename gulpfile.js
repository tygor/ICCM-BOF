// Gulpy gulp
const autoprefixer  = require('gulp-autoprefixer');
const babelify      = require('babelify');
const browserify    = require('browserify');
const del           = require('del');
const gulp          = require('gulp');
const gutil         = require('gulp-util');
const sass          = require('gulp-sass')(require('sass'));
const source        = require('vinyl-source-stream');
const sourcemaps    = require('gulp-sourcemaps');
const svgmin        = require('gulp-svgmin');
const svgsymbols    = require('gulp-svg-symbols');

// Paths
const paths = {
  js_src:  `${__dirname}/src/frontend/js`,
  js_dest: `${__dirname}/src/public/assets/js`,
  scss_src: `${__dirname}/src/frontend/scss`,
  css_dest: `${__dirname}/src/public/assets/css`,
  svg_src: `${__dirname}/src/frontend/svg`,
  svg_dest: `${__dirname}/src/public/assets/svg`
};

const dependencies = [];

let scriptsCount = 0;

// Empty temp folders
function clean() {
  return del([paths.js_dest,
              paths.css_dest]);
}

gulp.task('scripts', function () {
    return bundleJS(false);
});

gulp.task('scss', function () {
    return bundleCSS();
});

gulp.task('svg', function () {
    return bundleSVG();
});

gulp.task('deploy', function () {
    clean();
    bundleSVG();
    bundleCSS();
    return bundleJS(true);
});

gulp.task('watch', function () {
  gulp.watch(`${paths.js_src}/**/*.js`,  gulp.series('scripts'));
  gulp.watch(`${paths.scss_src}/**/*.scss`,  gulp.series('scss'));
  gulp.watch(`${paths.svg_src}/**/*.svg`,  gulp.series('svg'));
});

gulp.task('dev', gulp.series('scripts', 'scss', 'svg', 'watch'));

function bundleSVG() {
  return gulp.src(`${paths.svg_src}/**/*.svg`)
    .pipe(svgmin())
    .pipe(svgsymbols({
      svgClassname: 'svg-icon',
      templates: ['default-svg'],
      title: false,
    }))
    .pipe(gulp.dest(paths.svg_dest));
}

function bundleCSS() {
  return gulp
    .src(`${paths.scss_src}/**/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.css_dest));
}

function bundleJS(isProduction) {
  scriptsCount++;
  
  // Browserify will bundle all our js files together in to one and will let
  // us use modules in the front end.
  var appBundler = browserify(
    `${paths.js_src}/app.js`,
      { debug: true }
  );
 
  // If it's not for production, a separate vendors.js file will be created
  // the first time gulp is run so that we don't have to rebundle things like
  // react everytime there's a change in the js file
/*
  if (!isProduction && scriptsCount === 1) {
      // create vendors.js for dev environment.
      browserify({
        require: dependencies,
        debug: true
      })
      .bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulp.dest(paths.js_dest));
  }
*/
    
  if (!isProduction) {
      // make the dependencies external so they dont get bundled by the 
      // app bundler. Dependencies are already bundled in vendor.js for
      // development environments.
      dependencies.forEach(function(dep) {
        appBundler.external(dep);
      });
  }
  return appBundler
      // transform ES6 and JSX to ES5 with babelify
      .transform("babelify", {presets: ["env"]})
      .bundle()
      .on('error', function(e) { gutil.log(e.message); })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest(paths.js_dest));
}
