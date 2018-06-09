const ignore = () => 0;
const { StreamError } = require("./stream-error");

/**
 * Generate transform methods on the stream class.
 *
 * @internal
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */
module.exports = ({filter}) => function mkTransform(newOptions) {
    this.setOptions(
        {
            transforms: [],
            beforeTransform: newOptions.beforeTransform,
            afterTransform: newOptions.afterTransform,
            promiseFlush: newOptions.promiseFlush
        }
    );

    this.cork();
    if (newOptions.referrer instanceof this.constructor && !newOptions.referrer._tapped && !newOptions.referrer._options.flushPromise) {
        return true;
    }

    process.nextTick(this.uncork.bind(this));

    this.pushTransform(newOptions);

    if (this._scramjet_options.transforms.length) {

        let last = Promise.resolve();
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

            processing.push(last);   // append item to queue
            if (processing.length >= this._options.maxParallel) {
                processing[processing.length - this._options.maxParallel]
                    .then(() => callback())
                    .catch(ignore);
            } else {
                callback();
            }

            const ref = last;

            ref.then(
                    () => ref === processing.shift() || this.emit("error", new StreamError("Promise resolved out of sequence!", this, "TRANSFORM_OUT_OF_SEQ", chunk), chunk)
                )
                .catch(
                    (e) => {
                        this.emit("error", new StreamError(e, this, "EXTERNAL", chunk), chunk);
                        return Promise.resolve(null);
                    }
                )
                .catch(
                    ignore
                )
                ;

        };

        this._flush = (callback) => {
            if (this._scramjet_options.promiseFlush) {
                last.then(this._scramjet_options.promiseFlush).then((data) => {

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
    }
};
