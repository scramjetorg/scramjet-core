"use strict";

require("core-js/modules/es6.promise");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const _require = require("./stream-errors"),
      StreamError = _require.StreamError;
/**
 * Generate read methods on the stream class.
 *
 * @internal
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */


module.exports = () => function mkRead(newOptions) {
  var _this = this;

  this.setOptions({
    // transforms: [],
    promiseRead: newOptions.promiseRead
  });
  let chunks = [];
  let done = false; // TODO: implement the actual parallel logic - items can be promises and should be flushed when resolved.

  const pushSome = () => Array.prototype.findIndex.call(chunks, chunk => {
    return !this.push(chunk);
  }) + 1; // let last = Promise.resolve();
  // let processing = [];


  this.on("pipe", () => {
    throw new Error("Cannot pipe to a Readable stream");
  });

  this._read =
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (size) {
      try {
        let add = 0;

        if (!done) {
          const nw = yield _this._options.promiseRead(size);
          chunks.push(...nw);
          add = nw.length;
        }

        const pushed = pushSome();
        chunks = chunks.slice(pushed || Infinity);
        done = done || !add;

        if (done && !chunks.length) {
          yield new Promise((res, rej) => _this._flush(err => err ? rej(err) : res()));

          _this.push(null);
        } // console.log("read", pushed, chunks, add, size);
        // TODO: check for existence of transforms and push to transform directly.
        // TODO: but in both cases transform methods must be there... which aren't there now.
        // TODO: at least the subset that makes the transform - yes, otherwise all that transform stuff
        // TODO: is useless and can be bypassed...

      } catch (e) {
        yield _this.raise(new StreamError(e, _this));
        return _this._read(size);
      }
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};