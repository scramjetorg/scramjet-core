import {StreamError} from "./stream-errors";

const ignore = () => 0;


/**
 * Generate transform methods on the stream class.
 *
 * @internal
 * @memberof PromiseTransformStream
 * @param  {ScramjetOptions} newOptions Sanitized options passed to scramjet stream
 * @return {Boolean} returns true if creation of new stream is not necessary (promise can be pushed to queue)
 */
export default ({filter}) => function mkTransform(that, newOptions) {
    that.setOptions(
        {
            transforms: [],
            beforeTransform: newOptions.beforeTransform,
            afterTransform: newOptions.afterTransform,
            promiseFlush: newOptions.promiseFlush
        }
    );

    that.cork();
    if (
        newOptions.referrer instanceof that.constructor
        && !newOptions.referrer._tapped
        && !newOptions.referrer._options.flushPromise
    )
        return true;


    process.nextTick(that.uncork.bind(that));

    that.pushTransform(newOptions);

    if (that._scramjet_options.transforms.length) {
        const processing = [];
        let last = Promise.resolve();

        that._transform = (chunk, encoding, callback) => {
            if (!that._scramjet_options.transforms.length)
                return last.then(
                    () => callback(null, chunk)
                );


            const prev = last;
            const ref = last = Promise
                .all([
                    that._scramjet_options.transforms.reduce(
                        (prev, transform) => prev.then(transform),
                        Promise.resolve(chunk)
                    ).catch(
                        (err) => err === filter ? filter : Promise.reject(err)
                    ),
                    prev
                ])
                .catch(
                    async (e) => {
                        if (e instanceof Error)
                            return Promise.all([
                                that.raise(new StreamError(e, that, "EXTERNAL", chunk), chunk),
                                prev
                            ]);
                        throw new Error("New stream error raised without cause!");
                    }
                )
                .then(
                    (args) => {
                        if (args && args[0] !== filter && typeof args[0] !== "undefined")
                            that.push(args[0]);
                    }
                );

            processing.push(ref); // append item to queue
            if (processing.length >= that._options.maxParallel)
                processing[processing.length - that._options.maxParallel]
                    .then(() => callback())
                    .catch(ignore);
            else
                callback();


            ref.then(
                () => {
                    const next = processing.shift();
                    return ref !== next && that.raise(
                        new StreamError(
                            new Error(`Promise resolved out of sequence in ${that.name}!`),
                            that,
                            "TRANSFORM_OUT_OF_SEQ",
                            chunk
                        ),
                        chunk
                    );
                }
            );

            return null;
        };

        that._flush = (callback) => {
            if (that._scramjet_options.promiseFlush)
                last
                    .then(that._scramjet_options.promiseFlush)
                    .then(
                        (data) => {
                            if (Array.isArray(data))
                                data.forEach((item) => that.push(item));
                            else if (data)
                                that.push(data);

                            callback();
                        },
                        (e) => that.raise(e)
                    );
            else
                last.then(() => callback());
        };
    }

    return false;
};
