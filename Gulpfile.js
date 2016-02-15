var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var es = require('event-stream');

gulp.task('deploy', ['build'], function() {
  return gulp.src('./dist/**/*')
    .pipe(plugins.ghPages());
});

gulp.task('clean', function () {
  return gulp.src('dist', {
      read: false
    })
    .pipe(plugins.clean());
});

gulp.task('copy:fonts', function () {
  return gulp.src('fonts{,/**}/*')
    .pipe(plugins.copy('dist/'));
});

gulp.task('copy:images', function () {
  return gulp.src('images{,/**}/*.{png,jpg,gif,svg}')
    .pipe(plugins.copy('dist/'));
});

gulp.task('copy:favicon', function () {
  return gulp.src('favicon.ico')
    .pipe(plugins.copy('dist/'));
});

// HTML + Scripts
var htmlbuildJsPreprocessor = plugins.htmlbuild.preprocess.js(function (block) {

  var gulpSrc = function (opts) {
    var paths = es.through();
    var files = es.through();
    
    paths.pipe(es.writeArray(function (err, srcs) {
      gulp.src(srcs, opts).pipe(files);
    }));
    
    return es.duplex(paths, files);
  };
   
  var jsBuild = es.pipeline(
    plugins.concat('main.js'),
    gulp.dest('dist/')
  );

  block.pipe(gulpSrc())
  .pipe(jsBuild);
  
  block.end('main.js');

});

gulp.task('html', function() {
  return gulp.src('index.html')
    .pipe(plugins.htmlbuild({
      js: htmlbuildJsPreprocessor
    }))
    .pipe(gulp.dest('dist/'))
    .pipe(plugins.connect.reload());
});

gulp.task('scripts', function() {
  return gulp.src('./scripts/*.js')
    .pipe(gulp.dest('dist/scripts'))
    .pipe(plugins.connect.reload());
})

gulp.task('styles', function () {
  return gulp.src('./styles/main.scss')
    .pipe(plugins.sass().on('error', plugins.sass.logError))
    .pipe(gulp.dest('dist/styles'))
    .pipe(plugins.connect.reload());
});

gulp.task('build', [
  'html',
  'styles',
  'scripts',
  'copy:fonts',
  'copy:images',
  'copy:favicon'
]);

gulp.task('watch', function() {
  gulp.watch('index.html', ['html']);
  gulp.watch('styles/main.scss', ['styles']);
  gulp.watch('scripts/*.js', ['scripts']);
  gulp.watch('images/*.{png,jpg,gif,svg}', ['copy:images']);
});

gulp.task('connect', function(event) {
  plugins.connect.server({
      root: 'dist/',
      port: 8080,
      livereload: true
  });
});

gulp.task('serve', function() {
  return plugins.runSequence('clean', 'build', ['connect', 'watch']);
});

gulp.task('default', ['serve']);


