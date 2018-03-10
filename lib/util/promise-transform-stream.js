const {Transform} = require('stream');
const DefaultHighWaterMark = require("os").cpus().length * 2;

const filter = Symbol("FILTER");
const plgctor = Symbol("plgctor");
const storector = Symbol("storector");

const ignore = () => 0;

/**
 * DataStream is the primary stream type for Scramjet. When you parse your
 * stream, just pipe it you can then perform calculations on the data objects
 * streamed through your flow.
 *
 * @extends stream.PassThrough
 */
class PromiseTransformStream extends Transform {

    constructor(options) {
        options = options || {};
        const newOptions = Object.assign({
            objectMode: true,
            parallelTransform: null,
            flushPromise: null,
            beforeTransform: null,
            afterTransform: null
        }, options);

        super(newOptions);

        this._tapped = false;

        this._scramjet_options = {
            referrer: options.referrer,
            constructed: (new Error().stack)
        };

        this.setOptions(newOptions);

        if (newOptions.transform || !newOptions.parallelTransform) {

            this.tap();

        } else {
            this.setOptions(
                {
                    transforms: []
                },
                {
                    beforeTransform: newOptions.beforeTransform,
                    afterTransform: newOptions.afterTransform,
                    flushPromise: newOptions.flushPromise
                }
            );

            this.cork();
            if (options.referrer instanceof this.constructor && !options.referrer._tapped && !options.referrer._options.flushPromise) {
                return options.referrer.pushTransform(options);
            }

            process.nextTick(this.uncork.bind(this));

            this.pushTransform(newOptions);

            if (this._scramjet_options.transforms.length) this.mkTransform();

        }

        const plgctors = this.constructor[plgctor].get();
        if (plgctors.length) {

            let ret;
            plgctors.find(
                (Ctor) => ret = Ctor.call(this, options)
            );

            if (typeof ret !== "undefined") {
                return ret;
            }
        }
    }

    get _options() {
        if (this._scramjet_options.referrer && this._scramjet_options.referrer !== this) {
            return Object.assign({maxParallel: DefaultHighWaterMark}, this._scramjet_options.referrer._options, this._scramjet_options);
        }
        return Object.assign({maxParallel: DefaultHighWaterMark}, this._scramjet_options);
    }

    setOptions(...options) {
        Object.assign(this._scramjet_options, ...options);
        return this;
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

            this.on("error", () => rej());
            read();
        });
    }

    async whenDrained() {
        return new Promise((res, rej) => this.on("drain", res).on("error", rej));
    }

    async whenWrote(data) {
        if (this.write(data)) {
            return;
        } else {
            return this.whenDrained();
        }
    }

    async whenEnd() {
        return new Promise(res => this.once('end', res));
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

        if (typeof options.parallelTransform === "function") {

            const before = typeof options.beforeTransform === "function";
            const after = typeof options.afterTransform === "function";

            if (before)
                this._scramjet_options.transforms.push(options.beforeTransform.bind(this));

            if (after)
                this._scramjet_options.transforms.push(async (chunk) => {
                    return options.afterTransform.call(this, chunk, await options.parallelTransform.call(this, chunk));
                });
            else
                this._scramjet_options.transforms.push(options.parallelTransform.bind(this));

        }

        if (options.flushPromise)
            this._scramjet_options.flushPromise = async () => {
                return typeof options.flushPromise === "function" ? options.flushPromise() : null;
            };

        return this;
    }

    mkTransform() {

        let last = new Promise((res) => process.nextTick(() => res()));
        let processing = [];

        this._transform = (chunk, encoding, callback) => {
            if (!this._scramjet_options.transforms.length) {
                return last.then(
                    () => callback(null, chunk)
                );
            }

            last = Promise.all([
                this._scramjet_options.transforms.reduce(
                    (prev, transform) => prev.then(transform),
                    Promise.resolve(chunk)
                ).catch(
                    (err) => err === filter ? filter : Promise.reject(err)
                ),
                last
            ]).then(
                (args) => {
                    if (args[0] !== filter && typeof args[0] !== "undefined") {
                        this.push(args[0]);
                    }
                }
            );



            if (processing.length >= this._options.maxParallel) {
                processing[processing.length - this._options.maxParallel]
                    .then(() => callback())
                    .catch(ignore);
            } else {
                callback();
            }

            const ref = last;
            processing.push(ref);   // append item to queue

            ref.then(
                    () => ref === processing.shift() || this.emit("error", new Error("Promise resolved out of sequence!", chunk))
                )
                .catch(
                    (e) => Promise.resolve(null, this.emit("error", e, chunk))
                )
                .catch(
                    ignore // TODO: Another catch? WHY???
                )
                ;

        };

        this._flush = (callback) => {
            if (this._scramjet_options.flushPromise) {
                last.then(this._scramjet_options.flushPromise).then((data) => {

                    if (Array.isArray(data))
                        data.forEach(item => this.push(item));
                    else
                        this.push(data);

                    callback();
                });
            } else {
                last.then(() => callback());
            }
        };

        return this;
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

module.exports = {
    plgctor: plgctor,
    PromiseTransformStream
};
