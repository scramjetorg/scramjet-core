"use strict";

require("core-js/modules/es6.promise");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const _require = require("stream"),
      Transform = _require.Transform,
      Readable = _require.Readable;

const _require2 = require("events"),
      EventEmitter = _require2.EventEmitter;

const DefaultHighWaterMark = require("os").cpus().length * 2;
const filter = Symbol("FILTER");
const plgctor = Symbol("plgctor");
const storector = Symbol("storector");
let seq = 0;
const shared = {
  filter,
  DefaultHighWaterMark,
  plgctor,
  storector
};

const mkTransform = require("./mk-transform")(shared);

const mkRead = require("./mk-read")(shared);

const mkWrite = require("./mk-write")(shared);

const _require3 = require("./stream-errors"),
      StreamError = _require3.StreamError;

const rename = (ob, fr, to) => {
  if (ob[fr]) {
    ob[to] = ob[fr];
    delete ob[fr];
  }
};

const checkOptions = options => {
  rename(options, "parallelRead", "promiseRead");
  rename(options, "parallelWrite", "promiseWrite");
  rename(options, "parallelTransform", "promiseTransform");
  rename(options, "flushPromise", "promiseFlush");
  if (["promiseRead", "promiseWrite", "promiseTransform"].reduce((acc, key) => acc += options[key] ? 1 : 0, 0) > 1) throw new Error("Scramjet stream can be either Read, Write or Transform");
};
/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * @internal
 * @extends stream.PassThrough
 */


class PromiseTransformStream extends Transform {
  constructor(options) {
    options = options || {};
    const newOptions = Object.assign({
      objectMode: true,
      promiseRead: null,
      promiseWrite: null,
      promiseTransform: null,
      promiseFlush: null,
      beforeTransform: null,
      afterTransform: null
    }, options);
    checkOptions(newOptions);
    super(newOptions);
    this._tapped = false;
    this._error_handlers = [];
    this._scramjet_options = {
      referrer: options.referrer,
      constructed: new Error().stack
    };
    this.seq = seq++;
    this.setMaxListeners(DefaultHighWaterMark);
    this.setOptions(newOptions);

    if (newOptions.promiseRead) {
      this.type = "Read";
      mkRead.call(this, newOptions);
      this.tap();
    } else if (newOptions.promiseWrite) {
      this.type = "Write";
      mkWrite.call(this, newOptions);
    } else if (newOptions.transform || !newOptions.promiseTransform) {
      this.type = "Transform-";
      this.tap();
    } else {
      this.type = "Transform";

      if (newOptions.promiseTransform && mkTransform.call(this, newOptions)) {
        // returns true if transform can be pushed to referring stream
        return options.referrer.pushTransform(options);
      }
    }

    const pluginConstructors = this.constructor[plgctor].get();

    if (pluginConstructors.length) {
      let ret;
      pluginConstructors.find(Ctor => ret = Ctor.call(this, options));

      if (typeof ret !== "undefined") {
        return ret;
      }
    }
  }

  get name() {
    return `${this.constructor.name}(${this._options.name || this.seq})`;
  }

  set name(name) {
    this.setOptions({
      name
    });
  }

  get constructed() {
    return this._scramjet_options.constructed;
  }

  get _options() {
    if (this._scramjet_options.referrer && this._scramjet_options.referrer !== this) {
      return Object.assign({
        maxParallel: DefaultHighWaterMark
      }, this._scramjet_options.referrer._options, this._scramjet_options);
    }

    return Object.assign({
      maxParallel: DefaultHighWaterMark
    }, this._scramjet_options);
  }

  setOptions(...options) {
    Object.assign(this._scramjet_options, ...options);
    if (this._scramjet_options.maxParallel) this.setMaxListeners(this._scramjet_options.maxParallel);

    if (this._flushed) {
      options.forEach(({
        promiseFlush
      }) => Promise.resolve().then(promiseFlush).catch(e => this.raise(e)));
    }

    return this;
  }

  setMaxListeners(value) {
    return super.setMaxListeners.call(this, value + EventEmitter.defaultMaxListeners);
  }

  static get [plgctor]() {
    const proto = Object.getPrototypeOf(this);
    return {
      ctors: this[storector] = this.hasOwnProperty(storector) ? this[storector] : [],
      get: () => proto[plgctor] ? proto[plgctor].get().concat(this[storector]) : this[storector]
    };
  }

  whenRead(count) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return Promise.race([new Promise(res => {
        const read = () => {
          const ret = _this.read(count);

          if (ret !== null) {
            return res(ret);
          } else {
            _this.once("readable", read);
          }
        };

        read();
      }), _this.whenError(), _this.whenEnd()]);
    })();
  }

  whenDrained() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      return _this2._scramjet_drainPromise || (_this2._scramjet_drainPromise = new Promise((res, rej) => _this2.once("drain", () => {
        _this2._scramjet_drainPromise = null;
        res();
      }).whenError().then(rej)));
    })();
  }

  whenWrote(...data) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      let ret;

      for (var _i = 0; _i < data.length; _i++) {
        var item = data[_i];
        ret = _this3.write(item);
      }

      if (ret) {
        return;
      } else {
        return _this3.whenDrained();
      }
    })();
  }

  whenError() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      return _this4._scramjet_errPromise || (_this4._scramjet_errPromise = new Promise(res => {
        _this4.once("error", e => {
          _this4._scramjet_errPromise = null;
          res(e);
        });
      }));
    })();
  }

  whenEnd() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      return _this5._scramjet_endPromise || (_this5._scramjet_endPromise = new Promise((res, rej) => {
        _this5.whenError().then(rej);

        _this5.on("end", () => res());
      }));
    })();
  }

  whenFinished() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      return _this6._scramjet_finishPromise || (_this6._scramjet_finishPromise = new Promise((res, rej) => {
        _this6.whenError().then(rej);

        _this6.on("finish", () => res());
      }));
    })();
  }

  catch(callback) {
    this._error_handlers.push(callback);

    return this;
  }

  raise(err, ...args) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      return _this7._error_handlers.reduce((promise, handler) => promise.catch(lastError => handler(lastError instanceof StreamError ? lastError : new StreamError(lastError, _this7, err.code, err.chunk), ...args)), Promise.reject(err)).catch(err => _this7.emit("error", err, ...args));
    })();
  }

  pipe(to, options) {
    if (to === this) {
      return this;
    }

    if (this !== to && to instanceof PromiseTransformStream) {
      to.setOptions({
        referrer: this
      });
      this.on("error", err => to.raise(err));
      this.tap().catch(
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* (err, ...args) {
          yield to.raise(err, ...args);
          return filter;
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    } else if (to instanceof Readable) {
      this.on("error", (...err) => to.emit("error", ...err));
    }

    return super.pipe(to, options || {
      end: true
    });
  }

  graph(func) {
    let referrer = this;
    const ret = [];

    while (referrer) {
      ret.push(referrer);
      referrer = referrer._options.referrer;
    }

    func(ret);
    return this;
  }

  tap() {
    this._tapped = true;
    return this;
  }

  dropTransform(transform) {
    if (!this._scramjet_options.transforms) {
      if (!this._transform.currentTransform) return this;
      this._transform = this._transform.currentTransform;
      return this;
    }

    let i = 0;

    while (i++ < 1000) {
      const x = this._scramjet_options.transforms.findIndex(t => t.ref === transform);

      if (x > -1) {
        this._scramjet_options.transforms.splice(x, 1);
      } else {
        return this;
      }
    }

    throw new Error("Maximum remove attempt count reached!");
  }

  pushTransform(options) {
    var _this8 = this;

    if (typeof options.promiseTransform === "function") {
      if (!this._scramjet_options.transforms) {
        this._pushedTransform = options.promiseTransform;
        return this;
      }

      const markTransform = bound => {
        bound.ref = options.promiseTransform;
        return bound;
      };

      const before = typeof options.beforeTransform === "function";
      const after = typeof options.afterTransform === "function";
      if (before) this._scramjet_options.transforms.push(markTransform(options.beforeTransform.bind(this)));
      if (after) this._scramjet_options.transforms.push(markTransform(
      /*#__PURE__*/
      function () {
        var _ref2 = _asyncToGenerator(function* (chunk) {
          return options.afterTransform.call(_this8, chunk, (yield options.promiseTransform.call(_this8, chunk)));
        });

        return function (_x2) {
          return _ref2.apply(this, arguments);
        };
      }()));else this._scramjet_options.transforms.push(markTransform(options.promiseTransform.bind(this)));
    }

    if (typeof options.promiseFlush === "function") {
      if (this._scramjet_options.runFlush) {
        throw new Error("Promised Flush cannot be overwritten!");
      } else {
        this._scramjet_options.runFlush = options.promiseFlush;
      }
    }

    return this;
  }

  _selfInstance(...args) {
    return new this.constructor(...args);
  }

  _transform(chunk, encoding, callback) {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      if (!_this9._delayed_first) {
        yield new Promise(res => res());
        _this9._delayed_first = 1;
      }

      try {
        if (_this9._pushedTransform) chunk = yield _this9._pushedTransform(chunk);
        callback(null, chunk);
      } catch (err) {
        callback(err);
      }
    })();
  }

  _flush(callback) {
    const last = Promise.resolve();

    if (this._scramjet_options.runFlush) {
      last.then(this._scramjet_options.runFlush).then(data => {
        if (Array.isArray(data)) data.forEach(item => this.push(item));else if (data) this.push(data);
        callback();
      }, e => this.raise(e));
    } else {
      last.then(() => callback());
    }
  }

  static get filter() {
    return filter;
  }

}

module.exports = {
  plgctor: plgctor,
  PromiseTransformStream
};