/* eslint require-jsdoc:0 */

// const ignore = () => 0;

export class MultiTransform {

    /**
     * @typedef MultiTransformOptions
     * @prop {number} [maxParallel=32] max parallel
     * @prop {boolean} [followOrder=true] should order of resolutions be preserved?
     */

    /**
     *
     * @param {MultiTransformOptions} [options] parallelization options
     */
    constructor(options) {
        this._seq = 0;
        this.transforms = {};
        this.options = options || {};
        this._rebuild();
    }

    get options() {
        return {
            maxParallel: this._maxParallel,
            followOrder: this._followOrder
        };
    }

    set options({maxParallel, followOrder}) {
        this._maxParallel = +maxParallel || 32;
        this._followOrder = typeof followOrder === undefined ? true : !!followOrder;
    }

    pushTransform(transform) {
        const idx = ++ this._seq;
        this.transforms[idx] = {transform};
        this._rebuild();

        return {idx};
    }

    pushTrap({idx}, trap) {
        this.transforms[idx].trap = trap;

        return {idx};
    }

    pushHook({idx}, hook) {
        this.transforms[idx].hook = hook;

        return {idx};
    }

    _rebuildFIFO(transforms, processing) {
        const breakPoints = new WeakMap();
        async function breakpointAdvanced(prevReference, currentReference, number) {
            const ref = breakPoints.get(prevReference);
            const currentBreakpoints = breakPoints.get(currentReference);

            if (currentBreakpoints) {
                if (currentBreakpoints[number]) currentBreakpoints[number]();
                currentBreakpoints[number] = true;
            }

            return new Promise((res) => ref[number] ? res() : ref[number] = res);
        }

        let currentReference = {};
        let currFullResolution = Promise.resolve();

        return async (chunk) => {
            if (!transforms.length)
                return chunk;

            let breakPoint = 0;
            const prevReference = currentReference;
            currentReference = {};
            breakPoints.set(currentReference, []);

            // keep the previous promise reference
            const prevFullResolution = currFullResolution;

            currFullResolution = transforms
                .reduce(
                    (prev, {transform, hook, trap}) => {
                        // if there's no need to hold up here, just continue with the transform
                        if (!trap && !hook)
                            return prev.then(transform);

                        let _argument;
                        // each promise is first transformed
                        let out = prev.then(
                            async (argument) => transform(_argument = argument)
                        );

                        // Breakpoint is where the transform result must come in order
                        const currentBreakPoint = breakPoint++;
                        // if we need the output we need to sig
                        if (hook) out = out
                            .then(async (argument) => (
                                await breakpointAdvanced(prevReference, currentReference, currentBreakPoint),
                                argument
                            ))
                            .then(async (argument) => (await hook(argument, chunk), argument));

                        // if an error occurs somewhere along the lines.
                        // it's up to the implementation to handle all transforms between current
                        // and previous catch.
                        if (trap) out = out.catch(
                            async (err) => err ? trap(err, _argument) : Promise.reject()
                        );

                        return out;
                    },

                    // this is the initial promise
                    Promise.resolve(chunk)
                )
                .then(
                    // await previous item to be resolved
                    (x) => prevFullResolution.then(() => x)
                )
                .catch(
                    // empty rejection is resolved with empty item
                    (err) => err && Promise.reject(err)
                );

            return currFullResolution;
        };
    }

    _rebuildASAP(transforms) {
        return (chunk) => {
            if (!transforms.length)
                return chunk;

            return transforms
                .reduce(
                    (prev, {transform, hook, trap}) => {
                        // if there's no need to hold up here, just continue with the transform
                        if (!trap && !hook)
                            return prev.then(transform);

                        let _argument;
                        // each promise is first transformed
                        let out = prev.then(async (argument) => transform(_argument = argument));

                        // if we need the output we need to sig
                        if (hook) out = out.then((argument) => hook(argument, chunk));

                        // if an error occurs somewhere along the lines.
                        // it's up to the implementation to handle all transforms between current
                        // and previous catch.
                        if (trap) out = out.catch(async (err) => err ? trap(err, _argument) : Promise.reject());

                        return out;
                    },

                    // this is the initial promise
                    Promise.resolve(chunk)
                )
                .catch(
                    // empty resolution is resolved with empty item
                    (err) => err && Promise.reject(err)
                );
        };
    }

    _rebuild() {
        const processing = [];
        const transforms = Object.values(this.transforms).map(
            ({transform, hook}) => ({transform, hook})
        );

        this._execute = this._followOrder
            ? this._rebuildFIFO(transforms, processing)
            : this._rebuildASAP(transforms, processing)
        ;
    }

    /**
     * Executes the series of transforms on a chunk
     *
     * @async
     * @param {*} chunk the chunk to execute the operations on
     * @returns {void}
     */
    async execute(chunk) {
        return this._execute(chunk);
    }

}
