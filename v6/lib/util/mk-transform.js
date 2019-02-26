"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const ignore = () => 0;

const _require = require("./stream-errors"),
      StreamError = _require.StreamError;
/**
 * Generate transform methods on the stream class.
 *
 * @internal
 * @memberof PromiseTransformStream
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */


module.exports = ({
  filter
}) => function mkTransform(newOptions) {
  var _this = this;

  this.setOptions({
    transforms: [],
    beforeTransform: newOptions.beforeTransform,
    afterTransform: newOptions.afterTransform,
    promiseFlush: newOptions.promiseFlush
  });
  this.cork();

  if (newOptions.referrer instanceof this.constructor && !newOptions.referrer._tapped && !newOptions.referrer._options.promiseFlush) {
    return true;
  }

  process.nextTick(this.uncork.bind(this));
  this.pushTransform(newOptions);

  if (this._scramjet_options.transforms.length) {
    const processing = [];
    let last = Promise.resolve();

    this._transform = (chunk, encoding, callback) => {
      if (!this._scramjet_options.transforms.length) {
        return last.then(() => callback(null, chunk));
      }

      const prev = last;
      const ref = last = Promise.all([this._scramjet_options.transforms.reduce((prev, transform) => prev.then(transform), Promise.resolve(chunk)).catch(err => err === filter ? filter : Promise.reject(err)), prev]).catch(
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* (e) {
          if (e instanceof Error) {
            return Promise.all([_this.raise(new StreamError(e, _this, "EXTERNAL", chunk), chunk), prev]);
          } else {
            throw new Error("New stream error raised without cause!");
          }
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }()).then(args => {
        if (args && args[0] !== filter && typeof args[0] !== "undefined") {
          try {
            this.push(args[0]);
          } catch (e) {
            return this.raise(new StreamError(e, this, "INTERNAL", chunk), chunk);
          }
        }
      });
      processing.push(ref); // append item to queue

      if (processing.length >= this._options.maxParallel) {
        processing[processing.length - this._options.maxParallel].then(() => callback()).catch(ignore);
      } else {
        callback();
      }

      ref.then(() => {
        const next = processing.shift();
        return ref !== next && this.raise(new StreamError(new Error(`Promise resolved out of sequence in ${this.name}!`), this, "TRANSFORM_OUT_OF_SEQ", chunk), chunk);
      });
    };

    this._flush = callback => {
      if (this._scramjet_options.runFlush) {
        last.then(this._scramjet_options.runFlush).then(data => {
          if (Array.isArray(data)) data.forEach(item => this.push(item));else if (data) this.push(data);
        }, e => this.raise(e)).then(() => callback());
      } else {
        last.then(() => callback());
      }
    };
  }
};