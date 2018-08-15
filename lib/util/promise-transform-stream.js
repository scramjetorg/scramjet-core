const {Transform} = require("stream");
const {EventEmitter} = require("events");
const DefaultHighWaterMark = require("os").cpus().length * 2;
const ScramjetOptions = require("./options");

const filter = Symbol("FILTER");
const plgctor = Symbol("plgctor");
const storector = Symbol("storector");

let seq = 0;

const mkTransform = require("./mk-transform")({ filter, DefaultHighWaterMark, plgctor, storector });
const mkRead = require("./mk-read")();
const mkWrite = require("./mk-write")();

const rename = (ob, fr, to) => {
    if (ob[fr]) {
        ob[to] = ob[fr];
        delete ob[fr];
    }
};

const checkOptions = (options) => {
    rename(options, "parallelRead", "promiseRead");
    rename(options, "parallelWrite", "promiseWrite");
    rename(options, "parallelTransform", "promiseTransform");
    rename(options, "flushPromise", "promiseFlush");

    if (["promiseRead", "promiseWrite", "promiseTransform"].reduce((acc, key) => acc += (options[key] ? 1 : 0), 0) > 1)
        throw new Error("Scramjet stream can be either Read, Write or Transform");
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
            constructed: (new Error().stack)
        };

        this.seq = seq++;

        this.setMaxListeners(DefaultHighWaterMark);
        this.setOptions(newOptions);

        if (newOptions.promiseRead) {
            mkRead.call(this, newOptions);
            this.tap();
        } else if (newOptions.promiseWrite) {
            mkWrite.call(this, newOptions);
        } else if (newOptions.transform || !newOptions.promiseTransform) {
            this.tap();
        } else {
            if (newOptions.promiseTransform && mkTransform.call(this, newOptions)) { // returns true if transform can be pushed to referring stream
                return options.referrer.pushTransform(options);
            }
        }

        const pluginConstructors = this.constructor[plgctor].get();
        if (pluginConstructors.length) {

            let ret;
            pluginConstructors.find(
                (Ctor) => ret = Ctor.call(this, options)
            );

            if (typeof ret !== "undefined") {
                return ret;
            }
        }
    }

    get name() {
        return `${this.constructor.name}(${this._options.name || this.seq})`;
    }

    set name(name) {
        this.setOptions({name});
    }

    get constructed() {
        return this._scramjet_options.constructed;
    }

    get _options() {
        if (this._scramjet_options.referrer && this._scramjet_options.referrer !== this) {
            return Object.assign({maxParallel: DefaultHighWaterMark}, this._scramjet_options.referrer._options, this._scramjet_options);
        }
        return Object.assign({maxParallel: DefaultHighWaterMark}, this._scramjet_options);
    }

    setOptions(...options) {
        Object.assign(this._scramjet_options, ...options);

        if (this._scramjet_options.maxParallel)
            this.setMaxListeners(this._scramjet_options.maxParallel);

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

    async whenRead(count) {
        return new Promise((res, rej) => {

            const read = () => {
                const ret = this.read(count);
                if (ret) {
                    return res(ret);
                } else {
                    this.on("readable", read);
                }
            };

            this.whenError().then(rej);
            read();
        });
    }

    async whenDrained() {
        return this._scramjet_drainPromise || (this._scramjet_drainPromise = new Promise(
            (res, rej) => this
                .once("drain", () => {
                    this._scramjet_drainPromise = null;
                    res();
                })
                .whenError().then(rej)
        ));
    }

    async whenWrote(...data) {
        let ret;
        for (var item of data)
            ret = this.write(item);

        if (ret) {
            return;
        } else {
            return this.whenDrained();
        }
    }

    async whenError() {
        return this._scramjet_errPromise || (this._scramjet_errPromise = new Promise((res) => {
            this.once("error", (e) => {
                this._scramjet_errPromise = null;
                res(e);
            });
        }));
    }

    async whenEnd() {
        return this._scramjet_endPromise || (this._scramjet_endPromise = new Promise((res, rej) => {
            this.whenError().then(rej);
            this.on("end", () => {
                this._scramjet_endPromise = null;
                res();
            });
        }));
    }

    async whenFinished() {
        return this._scramjet_finishPromise || (this._scramjet_finishPromise = new Promise((res, rej) => {
            this.whenError().then(rej);
            this.on("finish", () => {
                this._scramjet_finishPromise = null;
                res();
            });
        }));
    }

    catch(callback) {
        this._error_handlers.push(callback);
        return this;
    }

    async raise(err, ...args) {
        return this._error_handlers
            .reduce((err, handler) => err.catch(err => handler(err, ...args)), Promise.reject(err))
            .catch((err) => this.emit("error", err, ...args));
    }

    graph(func) {
        let referrer = this;
        const ret = [];
        while(referrer) {
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

    pushTransform(options) {

        if (typeof options.promiseTransform === "function") {

            const before = typeof options.beforeTransform === "function";
            const after = typeof options.afterTransform === "function";

            if (before)
                this._scramjet_options.transforms.push(options.beforeTransform.bind(this));

            if (after)
                this._scramjet_options.transforms.push(async (chunk) => {
                    return options.afterTransform.call(this, chunk, await options.promiseTransform.call(this, chunk));
                });
            else
                this._scramjet_options.transforms.push(options.promiseTransform.bind(this));

        }

        if (options.flushPromise)
            this._scramjet_options.flushPromise = async () => {
                return typeof options.flushPromise === "function" ? options.flushPromise() : null;
            };

        return this;
    }

    _selfInstance(...args) {
        return new this.constructor(...args);
    }

    _transform(chunk, encoding, callback) {
        try {
            callback(null, chunk);
        } catch(err) {
            callback(err);
        }
    }

    static get filter() { return filter; }
}

ScramjetOptions.declare(PromiseTransformStream, "objectMode");
ScramjetOptions.declare(PromiseTransformStream, "promiseRead");
ScramjetOptions.declare(PromiseTransformStream, "promiseWrite");
ScramjetOptions.declare(PromiseTransformStream, "promiseTransform");
ScramjetOptions.declare(PromiseTransformStream, "promiseFlush");
ScramjetOptions.declare(PromiseTransformStream, "beforeTransform");
ScramjetOptions.declare(PromiseTransformStream, "afterTransform");

module.exports = {
    plgctor: plgctor,
    PromiseTransformStream
};
