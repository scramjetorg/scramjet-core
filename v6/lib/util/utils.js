"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const _require = require("path"),
      dirname = _require.dirname,
      resolve = _require.resolve;
/** @ignore */


const getCalleeDirname = function getCalleeDirname(depth) {
  const p = Error.prepareStackTrace;

  Error.prepareStackTrace = (dummy, stack) => stack;

  const e = new Error();
  Error.captureStackTrace(e, arguments.callee);
  const stack = e.stack;
  Error.prepareStackTrace = p;
  return dirname(stack[depth].getFileName());
};

const resolveCalleeRelative = function resolveCalleeRelative(depth, ...relatives) {
  return resolve(getCalleeDirname(depth + 1), ...relatives);
};
/** @ignore */


const resolveCalleeBlackboxed = function resolveCalleeBlackboxed() {
  const p = Error.prepareStackTrace;

  Error.prepareStackTrace = (dummy, stack) => stack;

  const e = new Error();

  try {
    Error.captureStackTrace(e, arguments.callee);
  } catch (e) {} // eslint-disable-line no-empty


  const stack = e.stack;
  Error.prepareStackTrace = p;
  let pos = stack.find(entry => entry.getFileName().indexOf(resolve(__dirname, "..")) === -1);
  return resolve(dirname(pos.getFileName()), ...arguments);
};
/**
 * @external AsyncGeneratorFunction
 */


let AsyncGeneratorFunction = function AsyncGeneratorFunction() {};

try {
  AsyncGeneratorFunction = require("./async-generator-constructor");
} catch (e) {} // eslint-disable-line

/**
 * @external GeneratorFunction
 */


const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
/** @ignore */

const pipeIfTarget = (stream, target) => target ? stream.pipe(target) : stream;
/** @ignore */


const pipeThen =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (func, target) {
    return Promise.resolve().then(func).then(x => x.pipe(target)).catch(e => target.raise(e));
  });

  return function pipeThen(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
/**
 * @external stream.PassThrough
 * @see https://nodejs.org/api/stream.html#stream_class_stream_passthrough
 */


module.exports = {
  AsyncGeneratorFunction,
  GeneratorFunction,
  getCalleeDirname,
  resolveCalleeRelative,
  resolveCalleeBlackboxed,
  pipeIfTarget,
  pipeThen
};