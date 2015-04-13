var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var del = require('del');
var bower = require('bower');

var names = [
  'master-detail',
  'sliding-menu',
  'tab-bar',
  'split-view'
];

///////////////
// update-onsenui
///////////////
gulp.task('update-onsenui', function(done) {
  bower.commands
    .install(['onsenui'], {}, {directory: 'temp'})
    .on('end', function(installed) {
      gulp.src('temp/onsenui/build/{js,css,stylus}/**/*')
        .pipe(gulp.dest('base/www/lib/onsen/'))
        .on('end', function() {
          gulp.src('temp/onsenui/build/css/onsen-css-*.css')
            .pipe(gulp.dest('base/www/styles/'))
            .on('end', function() {
              del(['temp'], done);
            });
        });
    });
});

///////////////
// prepare
///////////////
gulp.task('prepare', function(done) {
  var stream = gulp.src(['base/**/*', '!base/node_modules/**/*'], {dot: true});

  names.forEach(function(name) {
    stream = stream.pipe(gulp.dest('gen/' + name));
  });

  stream.on('end', function() {
    gulp.src(['templates/**/*'])
      .pipe(gulp.dest('gen/'))
      .on('end', done);
  });
});

///////////////
// compress
///////////////
gulp.task('compress', ['prepare'], function() {

  var streams = names.map(function(name) {
    var src = [
      __dirname + '/gen/' + name + '/**/*',
      '!.DS_Store',
      '!node_modules'
    ];

    var stream = gulp.src(src, {cwd : __dirname, dot: true})
      .pipe($.zip('onsenui-' + name + '.zip'))
      .pipe(gulp.dest('gen/'));

    return stream;
  });

  return merge.apply(null, streams);
});

///////////////
// browser-sync
///////////////
gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: '.',
      index: 'index.html',
      directory: true
    },
    ghostMode: false,
    notify: false,
  });
});

///////////////
// serve
///////////////
gulp.task('serve', ['prepare', 'browser-sync'], function() {
  gulp.watch(['base/**/*', 'templates/**/*', '!node_modules'], ['prepare']);
});

///////////////
// build
///////////////
gulp.task('build', function(done) {
  runSequence('clean', 'update-onsenui', 'compress', done);
});

///////////////
// clean
///////////////
gulp.task('clean', function(done) {
  del(['gen/*', '!gen/.gitignore'], done);
});
