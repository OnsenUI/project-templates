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
      gulp.src('temp/onsenui/build/js/ons*.js')
        .pipe(gulp.dest('base/www/lib/onsen/js/'))
        .on('end', function() {
          gulp.src('temp/onsenui/build/js/angular/**/*')
            .pipe(gulp.dest('base/www/lib/angular/'))
            .on('end', function() {
              gulp.src('temp/onsenui/build/{css,stylus}/**/*')
                .pipe(gulp.dest('base/www/lib/onsen/'))
                .on('end', function() {
                  del(['temp'], done);
                });
            });
        });
    });
});

///////////////
// prepare-cordova
///////////////
gulp.task('prepare-cordova', function(done) {
  var stream = gulp.src(['base/**/*', '!base/node_modules/**/*', '!base/node_modules/', '!base/scripts/**/*', '!base/scripts/'], {dot: true});

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
// prepare-VS2015
///////////////
gulp.task('prepare-VS2015', function(done) {
  var stream = gulp.src(['base/merges/**/*', 'base/www/**/*'], {dot: true, base: 'base'});
  var stream2 = gulp.src(['VS2015/base/**/*'], {dot: true, base: 'VS2015/base'});

  names.forEach(function(name) {
    stream = stream.pipe(gulp.dest('VS2015/gen/' + name));
    stream2 = stream2.pipe(gulp.dest('VS2015/gen/' + name));
  });

  stream.on('end', function() {
    gulp.src(['templates/**/*', 'VS2015/templates/**/*'])
      .pipe(gulp.dest('VS2015/gen/'))
      .on('end', done);
  });
});

///////////////
// compress-cordova
///////////////
gulp.task('compress-cordova', ['prepare-cordova'], function() {

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
// compress-VS2015
///////////////
gulp.task('compress-VS2015', ['prepare-VS2015'], function() {

  var streams = names.map(function(name) {
    var src = [
      __dirname + '/VS2015/gen/' + name + '/**/*',
      '!.DS_Store',
      '!node_modules'
    ];

    var stream = gulp.src(src, {cwd : __dirname, dot: true})
      .pipe($.zip('onsenui-' + name + '.zip'))
      .pipe(gulp.dest('VS2015/gen/'));

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
gulp.task('serve', ['prepare-cordova', 'prepare-VS2015', 'browser-sync'], function() {
  gulp.watch(['base/**/*', 'templates/**/*', '!node_modules'], ['prepare-cordova', 'prepare-VS2015']);
});

///////////////
// build
///////////////
gulp.task('build', function(done) {
  runSequence('clean', 'update-onsenui', 'compress-cordova', 'compress-VS2015', done);
});

gulp.task('build-cordova', function(done) {
  runSequence('clean', 'update-onsenui', 'compress-cordova', done);
});

gulp.task('build-VS2015', function(done) {
  runSequence('clean', 'update-onsenui', 'compress-VS2015', done);
});

///////////////
// clean
///////////////
gulp.task('clean', function(done) {
  del(['gen/*', '!gen/.gitignore', 'VS2015/gen/*', '!VS2015/gen/.gitignore'], done);
});
