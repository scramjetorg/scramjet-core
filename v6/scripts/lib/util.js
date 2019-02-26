"use strict";

require("core-js/modules/es6.promise");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const dmd = require("dmd");

const jsdoc = require("jsdoc-api");

const jsdocParse = require("jsdoc-parse");

const promisify = require("util").promisify || (fn => (...a) => new Promise((s, j) => fn(...a, (e, ...v) => e ? j(e) : s(...v))));

const jsdoc2md =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* ({
    files,
    plugin
  }) {
    const data = yield jsdoc.explain({
      files
    });
    const parsed = yield jsdocParse(data);
    const output = yield dmd.async(parsed, {
      plugin,
      "member-index-format": "list"
    });
    return output;
  });

  return function jsdoc2md(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = {
  jsdoc2md,
  promisify
};