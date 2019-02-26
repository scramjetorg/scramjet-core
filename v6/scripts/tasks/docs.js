"use strict";

require("core-js/modules/es6.promise");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const gulp = require("gulp");

const _require = require("../../"),
      DataStream = _require.DataStream;

const _require2 = require("../lib/util"),
      jsdoc2md = _require2.jsdoc2md;

const rename = require("gulp-rename");

const log = require("fancy-log");

module.exports = (source, jd2mdConfig, dest) => {
  return function makeDocs() {
    return DataStream.from(gulp.src(source)).map(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* (file) {
        const output = yield jsdoc2md(Object.assign({}, jd2mdConfig, {
          newLine: "\n",
          files: [file.path]
        }));
        file.contents = Buffer.from(output);
        return file;
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()).on("error", function (err) {
      log.error("jsdoc2md failed", err.stack);
    }).pipe(rename(function (path) {
      path.extname = ".md";
    })).pipe(gulp.dest(dest));
  };
};