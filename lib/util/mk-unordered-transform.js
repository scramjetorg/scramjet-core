const ignore = () => 0;
const { StreamError } = require("./stream-errors");

/**
 * Generate transform methods on the stream class.
 *
 * @internal
 * @memberof PromiseTransformStream
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

        let waiting = [];
        let processing = 0;
        let clearSlot = a => {
            let z = waiting.shift();
            processing--;
            z && z();
            return a;
        };

        const nextFreeSlot = async a => {
            if (processing < this._options.maxParallel)
                return (processing++, a);

            await new Promise(res => waiting.push(res));
            return nextFreeSlot(a);
        };

        this._transform = async (chunk, encoding, callback) => {
            if (!this._scramjet_options.transforms.length) {
                return callback(null, chunk);
            }

            await (
                this._scramjet_options.transforms
                    .reduce(
                        (prev, transform) => prev.then(transform),
                        nextFreeSlot(chunk)
                            .then(() => callback())
                            .catch(ignore)
                    )
                    .catch(
                        (err) => err === filter
                            ? filter
                            : this.raise(new StreamError(err, this, "EXTERNAL", chunk), chunk)
                    )
                    .then(clearSlot)
                    .then(
                        (arg) => {
                            if (arg !== filter && typeof arg !== "undefined") {
                                this.push(arg);
                            }
                        }
                    )
            );

        };

        this._flush = (callback) => {
            Promise.all(waiting).then(() => callback(), (err) => callback(err));
        };
    }
};
