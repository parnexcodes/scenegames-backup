const browserify = require('browserify');
const glob = require('glob');
const {
  src, dest, series, watch,
} = require('gulp');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const rev = require('gulp-rev');
const gulpif = require('gulp-if');
const i18next = require('gulp-i18next-conv');
const Fiber = require('fibers');
sass.compiler = require('sass');

const isProd = process.env.NODE_ENV === 'production';

function css() {
  return src(['./src/styles/*.scss', '!./src/styles/nfo.scss'])
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass({
      fiber: Fiber,
      includePaths: ['node_modules'],
    }))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(gulpif(isProd, rev()))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('public/'))
    .pipe(gulpif(isProd, rev.manifest({ merge: true })))
    .pipe(gulpif(isProd, dest('.')));
}

function js() {
  const files = glob.sync('./src/js/*.js', { ignore: ['./src/js/nfo.js'] });
  const b = browserify({
    entries: files,
    debug: !isProd,
  });

  return b.bundle()
    .pipe(source('./js.js'))
    .pipe(buffer())
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env'],
      comments: !isProd,
      minified: isProd,
      env: {
        production: {
          presets: ['@babel/env', 'minify'],
        },
      },
    }))
    .pipe(gulpif(isProd, rev()))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('public/'))
    .pipe(gulpif(isProd, rev.manifest({ merge: true })))
    .pipe(gulpif(isProd, dest('.')));
}

function nfoCss() {
  return src('./src/styles/nfo.scss')
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass({
      fiber: Fiber,
      includePaths: ['node_modules'],
    }))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(gulpif(isProd, rev()))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('public/'))
    .pipe(gulpif(isProd, rev.manifest({ merge: true })))
    .pipe(gulpif(isProd, dest('.')));
}

function nfoJs() {
  const b = browserify({
    entries: './src/js/nfo.js',
    debug: !isProd,
  });

  return b.bundle()
    .pipe(source('./nfo.js'))
    .pipe(buffer())
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env'],
      comments: !isProd,
      minified: isProd,
      env: {
        production: {
          presets: ['@babel/env', 'minify'],
        },
      },
    }))
    .pipe(gulpif(isProd, rev()))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('public/'))
    .pipe(gulpif(isProd, rev.manifest({ merge: true })))
    .pipe(gulpif(isProd, dest('.')));
}

function buildLocales() {
  return src('./locales/*/*.po')
    .pipe(i18next())
    .pipe(dest('locales/build/'));
}

exports.watch = () => {
  watch(['./src/styles/*.scss', '!./src/styles/nfo.scss'], css);
  watch(['./src/js/*.js', '!./src/js/nfo.js'], js);
  watch('./src/js/nfo.js', nfoJs);
  watch('./src/styles/nfo.scss', nfoCss);
  watch('./locales/*/*.po', buildLocales);
};
exports.build = series(css, js, nfoJs, nfoCss, buildLocales);
exports.locale = buildLocales;
exports.default = exports.build;
