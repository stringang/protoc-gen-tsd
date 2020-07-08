const gulp = require('gulp');
const rimraf = require('rimraf');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const merge = require('merge2');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', async function(cb) {
  await rimraf('lib/**/*', cb);
});

gulp.task('ts:compiler', function() {
  const tsResult =  tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject());

  return merge([
    tsResult.dts.pipe(gulp.dest(tsProject.options.outDir)),
    tsResult.js.pipe(gulp.dest(tsProject.options.outDir))
  ])
});

gulp.task('copy:template', function() {
  return gulp.src('src/template/*.tmpl').pipe(gulp.dest(`${tsProject.options.outDir}/template`));
});

gulp.task('default', gulp.series('clean', 'ts:compiler', 'copy:template'));
