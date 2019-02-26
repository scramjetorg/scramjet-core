"use strict";

require("core-js/modules/es6.promise");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const _require = require("../lib/util"),
      jsdoc2md = _require.jsdoc2md,
      promisify = _require.promisify;

const fs = require("fs");

module.exports = (config, target) => {
  return (
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      return promisify(fs.writeFile)(target, (yield jsdoc2md(config)));
    })
  );
};