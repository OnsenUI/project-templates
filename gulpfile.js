var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var merge = require('event-stream').merge;
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var argv = require('yargs').argv;
var del = require('del');
var bower = require('bower');

var names = [
  'master-detail',
  'sliding-menu',
  'tab-bar',
  'split-view'
];

var isJSTemplateFile = function(file) {
  return (['vstemplate', 'jsproj'].indexOf(file.path.split('.').pop()) >= 0);
}, isIndexHtml = function(file) {
  return file.path.split('/').pop() === 'index.html';
}, isBundleFile = function(file) {
  return file.path.split('/').pop().match(/\w+_all\..+/);
};

// VSIX file versioning
var vsixVersion = argv.vsix ? argv.vsix : '1.0.0';

///////////////
// update-onsenui
///////////////
gulp.task('update-onsenui', function(done) {
  bower.commands
    .install(['onsenui'], {}, {directory: 'temp'})
    .on('end', function(installed) {
      gulp.src('temp/OnsenUI/build/js/ons*.js')
        .pipe(gulp.dest('base/www/lib/onsen/js/'))
        .on('end', function() {
          gulp.src('temp/angular/**/*')
            .pipe(gulp.dest('base/www/lib/angular/'))
            .on('end', function() {
              gulp.src('temp/OnsenUI/build/{css,stylus}/**/*')
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
  var streamBase = gulp.src(['VS2015/base/**/*', '!VS2015/base/VSIX/**/*', '!VS2015/base/VSIX/'], {dot: true, base: 'VS2015/base'});
  var streamBaseJS = gulp.src(['base/merges/**/*', 'base/www/**/*', '!base/www/lib/onsen/stylus/**/*', '!base/www/lib/onsen/stylus/'], {dot: true, base: 'base'})
      .pipe($.ignore.exclude(isBundleFile)); // Ignore heavy bundle libraries;
  var streamBaseTS = gulp.src(['base/merges/**/*', 'base/www/**/*', '!base/www/lib/onsen/stylus/**/*', '!base/www/lib/onsen/stylus/',
                              '!base/www/scripts/**/*', '!base/www/scripts/', 'base/scripts/**/*'], {dot: true, base: 'base'})
      .pipe($.ignore.exclude(isBundleFile)); // Ignore heavy bundle libraries;

  var streams = names.map(function(name) {
    streamBase = streamBase
      .pipe(gulp.dest('VS2015/gen/' + name))
      .pipe(gulp.dest('VS2015/gen/' + name + '-TS'));

    streamBaseJS = streamBaseJS.pipe(gulp.dest('VS2015/gen/' + name));
    streamBaseTS = streamBaseTS.pipe(gulp.dest('VS2015/gen/' + name + '-TS'));

    return [streamBase, streamBaseJS, streamBaseTS];
  });

  streams = streams.reduce(function(a, b) {
    return a.concat(b);
  });

  merge(streams).on('end', function() {
    gulp.src(['templates/**/*', 'VS2015/templates/**/*', '!VS2015/templates/*/TS/*', '!VS2015/templates/*/TS'])
      // JavaScript templates
      .pipe(gulp.dest('VS2015/gen/'))
      // TypeScript templates
      .pipe($.ignore.exclude(isJSTemplateFile)) // Ignore files for JS Templates
      .pipe($.rename(function(path) { // Modify the path
        path.dirname = path.dirname.replace(/^([\w,-]+)/, '$1-TS');
      }))
      .pipe($.if(isIndexHtml, $.replace('platformOverrides.js', 'appBundle.js'))) // Some necessary modifications to index.html
      .pipe($.if(isIndexHtml, $.replace(/\n\s+.+scripts\/index.js.+\n/, '\n'))) // Delete one line
      .pipe(gulp.dest('VS2015/gen/'))
      .on('end', function() {
        // More TS specific stuff
        gulp.src(['VS2015/templates/*/TS/*'])
          .pipe($.rename(function(path) {
            path.dirname = path.dirname.replace(/\/TS/, '-TS');
          }))
          .pipe(gulp.dest('VS2015/gen/'))
          .on('end', done);
      });
  });
});

///////////////
// prepare-MFP
///////////////
gulp.task('prepare-MFP', function(done) {
  var stream = gulp.src(['base/**/*', '!base/node_modules/**/*', '!base/node_modules/', '!base/scripts/**/*', '!base/scripts/', '!base/config.xml', 'MFP/base/**/*'], {dot: true});

  names.forEach(function(name) {
    stream = stream.pipe(gulp.dest('MFP/gen/' + name));
  });

  stream.on('end', function() {
    gulp.src(['templates/**/*'])
      .pipe($.replace(/(\n)(\<\/head\>)/, '\n\t\<script src=\"js\/mfp\.js\"\>\<\/script\>\n\n$2')) // Some necessary modifications to index.html
      .pipe(gulp.dest('MFP/gen/'))
      .on('end', done);
  });
});

///////////////
// prepare-TACO
///////////////
gulp.task('prepare-TACO', function(done) {
  var streamBase = gulp.src(['base/**/*', '!base/node_modules/**/*', '!base/node_modules/', '!base/scripts/**/*', '!base/scripts/', '!base/www/scripts/**/*', '!base/www/scripts', '!base/config.xml', 'TACO/base/**/*'], {dot: true});
  var streamBaseJS = gulp.src(['base/www/scripts/**/*'], {dot: true});
  var streamBaseTS = gulp.src(['base/scripts/**/*'], {dot: true});

  var streams = names.map(function(name) {
    streamBase = streamBase
      .pipe(gulp.dest('TACO/gen/' + name))
      .pipe(gulp.dest('TACO/gen/typescript/' + name));

    streamBaseJS = streamBaseJS.pipe(gulp.dest('TACO/gen/' + name + '/www/scripts/'));
    streamBaseTS = streamBaseTS.pipe(gulp.dest('TACO/gen/typescript/' + name + '/scripts/'));

    return [streamBase, streamBaseJS, streamBaseTS];
  });

  streams = streams.reduce(function(a, b) {
    return a.concat(b);
  });

  merge(streams).on('end', function() {
    gulp.src(['templates/**/*'])
      // JavaScript templates
      .pipe(gulp.dest('TACO/gen/'))
      // TypeScript templates
      .pipe($.if(isIndexHtml, $.replace(/\n\s+.+scripts\/platformOverrides.js.+\n/, '\n'))) // Delete one line
      .pipe(gulp.dest('TACO/gen/typescript/'))
      .on('end', done);
  });
});

///////////////
// prepare
///////////////
gulp.task('prepare', function(done) {
  runSequence('prepare-cordova', 'prepare-VS2015', done);
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
    var srcJS = [
      __dirname + '/VS2015/gen/' + name + '/**/*',
      '!.DS_Store'
    ], srcTS = [
      __dirname + '/VS2015/gen/' + name + '-TS/**/*',
      '!.DS_Store'
    ];

    var streamJS = gulp.src(srcJS, {cwd : __dirname, dot: true})
      .pipe($.zip('onsenui-' + name + '.zip'))
      .pipe(gulp.dest('VS2015/gen/')),
    streamTS = gulp.src(srcTS, {cwd : __dirname, dot: true})
      .pipe($.zip('onsenui-' + name + '-TS.zip'))
      .pipe(gulp.dest('VS2015/gen/'));

    return [streamJS, streamTS];
  });

  streams = streams.reduce(function(a, b) {
      return a.concat(b);
    });

  return merge.apply(null, streams);
});

///////////////
// compress
///////////////
gulp.task('compress', function(done) {
  runSequence('compress-cordova', 'compress-VS2015', done);
});

///////////////
// generate-vsix
///////////////
gulp.task('generate-vsix', ['compress-VS2015'], function(done) {
  var isVSIXManifest = function(file) {
    return file.path.split('/').pop() === 'extension.vsixmanifest';
  };

  gulp.src(['VS2015/base/VSIX/**/*'])
    .pipe($.if(isVSIXManifest, $.replace('VSIXVERSION', vsixVersion)))
    .pipe(gulp.dest('VS2015/gen/VSIX/'))
    .on('end', function() {
      gulp.src(['VS2015/gen/*.zip'])
        .pipe(gulp.dest('VS2015/gen/VSIX/ProjectTemplates/Apache%20Cordova%20Apps/'))
        .on('end', function() {
          gulp.src(['VS2015/gen/VSIX/**/*'], {dot: false, base: 'VS2015/gen/VSIX'})
          .pipe($.zip('Onsen UI Extension.vsix'))
          .pipe(gulp.dest('VS2015/gen/'))
          .on('end', done);
        });
    });
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
  gulp.watch(['base/**/*', 'templates/**/*', '!node_modules'], ['prepare'])
;});

///////////////
// build
///////////////
gulp.task('build', function(done) {
  runSequence('clean', 'update-onsenui', 'compress-cordova', 'generate-vsix', 'prepare-MFP', 'prepare-TACO', done);
});

gulp.task('build-cordova', function(done) {
  runSequence('clean', 'update-onsenui', 'compress-cordova', done);
});

gulp.task('build-VS2015', function(done) {
  runSequence('clean', 'update-onsenui', 'generate-vsix', done);
});

gulp.task('build-MFP', function(done) {
  runSequence('clean', 'update-onsenui', 'prepare-MFP', done);
});

gulp.task('build-TACO', function(done) {
  runSequence('clean', 'update-onsenui', 'prepare-TACO', done);
});
///////////////
// clean
///////////////
gulp.task('clean', function(done) {
  del(['gen/*', '!gen/.gitignore', 'VS2015/gen/*', '!VS2015/gen/.gitignore'], done);
});
