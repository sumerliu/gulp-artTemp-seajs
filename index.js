'use strict';

var BufferStreams = require('bufferstreams');
var htmlmin = require('html-minifier');
var gutil = require('gulp-util');
var objectAssign = require('object-assign');
var Transform = require('readable-stream/transform');
var tryit = require('tryit');

module.exports = function gulpHtmlmin(options,prefix) {

  return new Transform({
    objectMode: true,
    transform: function htmlminTransform(file, enc, cb) {
      if (file.isNull()) {
        cb(null, file);
        return;
      }
      function minifyHtml(buf, done) {
        var result;
        tryit(function() {
          //result = new Buffer(htmlmin.minify(String(buf), options));
          var str = htmlmin.minify(String(buf), options);
          // var reg = /<script(?:\s+[^>]*)?>(.*?)<\/script\s*>/ig;
          // var modelreg = reg.exec(str);
          //var pathName = file.path.replace(file.base,"").split(".")[0];
          //var length = pathName[0].length;
          //pathName = pathName.split('/').splice( length - 2,2 ).join('/');

          // var strJson = {
          //     html: modelreg.input.replace(modelreg[0], ''),
          //     js: modelreg[1]
          // };
          var startDefine = 'define(function(require,module,exports){';
          var endDefine = '})';
          var contents = startDefine +'return '+ JSON.stringify(str)+endDefine;
          result = new Buffer(contents);
        }, function(err) {
          if (err) {
            options = objectAssign({}, options, {fileName: file.path});
            done(new gutil.PluginError('gulp-htmlmin', err, options));
            return;
          }
          done(null, result);
        });
      }

      var self = this;

      if (file.isStream()) {
        file.contents.pipe(new BufferStreams(function(none, buf, done) {
          minifyHtml(buf, function(err, contents) {
            if (err) {
              self.emit('error', err);
              done(err);
            } else {
              done(null, contents);
              self.push(file);
            }
            cb();
          });
        }));
        return;
      }

      minifyHtml(file.contents, function(err, contents) {
        if (err) {
          self.emit('error', err);
        } else {
          file.contents = contents;
          self.push(file);
        }
        cb();
      });
    }
  });
};
