import {Transform, Readable} from "stream";
import {EventEmitter} from "events";
import ScramjetOptions from "./util/options";
import {StreamError} from "./util/stream-errors";
import {cpus} from "os";

const DefaultHighWaterMark = cpus().length * 2;

export const filter = Symbol("FILTER");
export const plgctor = Symbol("plgctor");
export const storector = Symbol("storector");

let seq = 0;

const mkTransform = require("./util/mk-transform")({filter, DefaultHighWaterMark, plgctor, storector});
const mkRead = require("./util/mk-read")();
const mkWrite = require("./util/mk-write")();

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

    if (
        ["promiseRead", "promiseWrite", "promiseTransform"]
            .reduce((acc, key) => acc += options[key] ? 1 : 0, 0)
        > 1
    )
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
export class PromiseTransformStream extends Transform {

    /**
     * PromiseTransformStream constructor
     *
     * @param {ScramjetOptions} options stream options
     */
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
            mkRead(this, newOptions);
            this.tap();
        } else if (newOptions.promiseWrite)
            mkWrite(this, newOptions);
        else if (newOptions.transform || !newOptions.promiseTransform)
            this.tap();
        // returns true if transform can be pushed to referring stream
        else if (newOptions.promiseTransform && mkTransform(this, newOptions))
            return options.referrer.pushTransform(options);


        const pluginConstructors = this.constructor[plgctor].get();
        if (pluginConstructors.length) {
            let ret;
            pluginConstructors.find(
                (Ctor) => ret = Ctor.call(this, options)
            );

            if (typeof ret !== "undefined")
                return ret;
        }
    }

    /**
     * Gets the name of the stream with it's type included
     *
     * @prop {String} name the stream name
     */
    get name() {
        return `${this.constructor.name}(${this._options.name || this.seq})`;
    }

    /**
     * Sets the name of the stream
     *
     * @param {String} name set name
     */
    set name(name) {
        this.setOptions({name});
    }

    /**
     * Returns constructed methods
     */
    get constructed() {
        return this._scramjet_options.constructed;
    }

    /**
     * Local accessor for options.
     *
     * @private
     */
    get _options() {
        if (this._scramjet_options.referrer && this._scramjet_options.referrer !== this)
            return Object.assign(
                {maxParallel: DefaultHighWaterMark},
                this._scramjet_options.referrer._options,
                this._scramjet_options
            );

        return Object.assign({maxParallel: DefaultHighWaterMark}, this._scramjet_options);
    }

    /**
     * Allows resetting stream options.
     *
     * It's much easier to use this in chain than constructing new stream:
     *
     * ```javascript
     *     stream.map(myMapper).filter(myFilter).setOptions({maxParallel: 2})
     * ```
     *
     * @meta.conditions keep-order,chain
     *
     * @name setOptions
     * @method
     * @param {StreamOptions} options options to be set
     * @chainable
     * @returns {PromiseTransfromStream} returns self
     */
    setOptions(...options) {
        Object.assign(this._scramjet_options, ...options);

        if (this._scramjet_options.maxParallel)
            this.setMaxListeners(this._scramjet_options.maxParallel);

        if (this._flushed)
            options.forEach(
                ({promiseFlush}) => Promise
                    .resolve()
                    .then(promiseFlush)
                    .catch((e) => this.raise(e))
            );


        return this;
    }

    /**
     * Sets max listeners
     *
     * @override
     * @param {number} value the number of max listeners
     */
    setMaxListeners(value) {
        return super.setMaxListeners.call(this, value + EventEmitter.defaultMaxListeners);
    }

    /**
     * Reads a chunk from the stream and resolves the promise when read.
     *
     * @async
     * @param {number} count how many items to read
     * @name whenRead
     * @method
     */
    async whenRead(count) {
        return new Promise((res, rej) => {
            const read = () => {
                const ret = this.read(count);
                return ret ? res(ret) : this.on("readable", read);
            };

            this.whenError().then(rej);
            read();
        });
    }

    /**
     * Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
     *
     * @async
     * @param {*} chunk a chunk to write
     * @param {...*} [more] more chunks to write
     */
    async whenWrote(...data) {
        let ret;
        for (const item of data)
            ret = this.write(item);

        return ret || this.whenDrained();
    }

    /**
     * Returns a promise that resolves when the stream is drained after the call.
     *
     * @async
     * @returns {void}
     */
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

    /**
     * Returns a promise that resolves (!) when the stream is errors
     *
     * @async
     * @returns {Error} thrown error
     */
    async whenError() {
        return this._scramjet_errPromise || (this._scramjet_errPromise = new Promise((res) => {
            this.once("error", (e) => {
                this._scramjet_errPromise = null;
                res(e);
            });
        }));
    }

    /**
     * Resolves when stream ends - rejects on uncaught error
     *
     * @async
     * @return {void}
     */
    async whenEnd() {
        return this._scramjet_endPromise || (this._scramjet_endPromise = new Promise((res, rej) => {
            this.whenError().then(rej);
            this.on("end", res);
        }));
    }

    /**
     * Resolves when stream is finished (all the data has been ingested) - rejects on uncaught error
     *
     * @async
     * @return {void}
     */
    async whenFinished() {
        return this._scramjet_finishPromise || (this._scramjet_finishPromise = new Promise((res, rej) => {
            this.whenError().then(rej);
            this.on("finish", res);
        }));
    }

    /**
     * Provides a way to catch errors in chained streams.
     *
     * The handler will be called as asynchronous
     *  - if it resolves then the error will be muted.
     *  - if it rejects then the error will be passed to the next handler
     *
     * If no handlers will resolve the error, an `error` event will be emitted
     *
     * @chainable
     * @name catch
     * @memberof DataStream#
     * @method
     * @param {Function} callback Error handler (async function)
     * @returns {PromiseTransfromStream} returns self
     *
     * @example {@link ../samples/data-stream-catch.js}
     */
    catch(callback) {
        this._error_handlers.push(callback);
        return this;
    }

    /**
     * Executes all error handlers and if none resolves, then emits an error.
     *
     * The returned promise will always be resolved even if there are no successful handlers.
     *
     * @async
     * @name raise
     * @memberof DataStream#
     * @method
     * @param {Error} err The thrown error
     * @returns {*} resolved chunk
     *
     * @example {@link ../samples/data-stream-raise.js}
     */
    async raise(err, ...args) {
        return this._error_handlers
            .reduce(
                (promise, handler) => promise.catch(
                    (lastError) => handler(
                        lastError instanceof StreamError
                            ? lastError
                            : new StreamError(lastError, this, err.code, err.chunk),
                        ...args
                    )
                ),
                Promise.reject(err)
            )
            .catch(
                (err) => this.emit("error", err, ...args)
            );
    }

    /**
     * Override of node.js Readable pipe.
     *
     * Except for calling overridden method it proxies errors to piped stream.
     *
     * @chainable
     * @param  {Writable} to  Writable stream to write to
     * @param  {Object} options pipe options
     * @return {Writable}  the `to` stream
     */
    pipe(to, options) {
        if (to === this)
            return this;


        if (this !== to && to instanceof PromiseTransformStream) {
            to.setOptions({referrer: this});
            this.on("error", (err) => to.raise(err));
            this.tap().catch(async (err, ...args) => {
                await to.raise(err, ...args);
                return filter;
            });
        } else if (to instanceof Readable)
            this.on("error", (...err) => to.emit("error", ...err));


        return super.pipe(to, options || {end: true});
    }

    /**
     * Returns a graph of chained transforms
     *
     * @param {Function} func callback funciton
     * @chainable
     * @returns {PromiseTransfromStream} returns self
     */
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

    /**
     * Stops merging transform callbacks at the current place in the command chain.
     *
     * @chainable
     * @returns {PromiseTransfromStream} returns self
     *
     * @example {@link ../samples/data-stream-tap.js}
     */
    tap() {
        this._tapped = true;
        return this;
    }

    /**
     * Adds transforms to the list
     *
     * @internal
     * @param {ScramjetOptions} options the stream options
     * @chainable
     * @returns {PromiseTransfromStream} returns self
     */
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

        if (options.promiseFlush)
            this._scramjet_options.promiseFlush = async () => {
                return typeof options.promiseFlush === "function" ? options.promiseFlush() : null;
            };

        return this;
    }

    /**
     * Returns a new instance of self.
     *
     * Normally this doesn't have to be overridden.
     * When the constructor would use some special arguments this may be used to
     * override the object construction in {@link tee}...
     *
     * @meta.noReadme
     * @return {PromiseTransformStream}  an empty instance of the same class.
     * @example {@link ../samples/data-stream-selfinstance.js}
     */
    _selfInstance(...args) {
        return new this.constructor(...args);
    }

    /**
     * @override
     */
    _transform(chunk, encoding, callback) {
        try {
            callback(null, chunk);
        } catch (err) {
            callback(err);
        }
    }

    /**
     * @override
     */
    _flush(callback) {
        if (this._scramjet_options.promiseFlush)
            Promise.resolve()
                .then(this._scramjet_options.promiseFlush)
                .then(
                    (data) => {
                        if (Array.isArray(data))
                            data.forEach((item) => this.push(item));
                        else if (data)
                            this.push(data);

                        callback();
                    },
                    (e) => this.raise(e)
                );
        else
            callback();
    }

    /**
     * Getter for the filter symbol.
     */
    static get filter() {
        return filter;
    }

}

ScramjetOptions.declare(PromiseTransformStream, "objectMode");
ScramjetOptions.declare(PromiseTransformStream, "promiseRead");
ScramjetOptions.declare(PromiseTransformStream, "promiseWrite");
ScramjetOptions.declare(PromiseTransformStream, "promiseTransform");
ScramjetOptions.declare(PromiseTransformStream, "promiseFlush");
ScramjetOptions.declare(PromiseTransformStream, "beforeTransform");
ScramjetOptions.declare(PromiseTransformStream, "afterTransform");
