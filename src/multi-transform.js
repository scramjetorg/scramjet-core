/* eslint require-jsdoc:0 */

// const ignore = () => 0;

export class MultiTransform {

    constructor(options) {
        this._seq = 0;
        this.transforms = {};
        this.options = options;
    }

    get options() {
        return {
            maxParallel: this._maxParallel
        };
    }

    set options({maxParallel, followOrder}) {
        this._maxParallel = +maxParallel;
        this._followOrder = !!followOrder;
    }

    pushTransform(transform) {
        const idx = ++ this._seq;
        this.transforms[idx] = {transform};
        this._rebuild();

        return {idx};
    }

    _rebuildFIFO(transforms) {
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
        return (chunk) => {
            if (!transforms.length)
                return chunk;

            let breakPoint = 0;
            const prevReference = currentReference;
            currentReference = {};
            breakPoints.set(currentReference, []);

            return transforms
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

                        // if we need the output we need to sig
                        if (hook) out = out
                            .then(async (argument) => (
                                await breakpointAdvanced(prevReference, currentReference, breakPoint++),
                                argument
                            ))
                            .then((argument) => hook(argument));

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
                .catch(
                    // empty resolution is resolved with empty item
                    (err) => err && Promise.reject(err)
                );
        };
    }

    _rebuildASAP() {

    }

    _rebuild() {
        const processing = [];
        const transforms = Object.values(transforms).map(
            ({transform, hook}) => ({transform, hook})
        );

        this._execute = this._followOrder
            ? this._rebuildFIFO(transforms, processing)
            : this._rebuildASAP(transforms, processing)
        ;
    }

    generateReadImpl({idx} = {}) {
        if (idx) {
            this.transforms[idx].hook = function() {};
            this._rebuild();
        }

        return async function* () {

        };
    }

    generateWriteImpl() {
        return async function() {

        };
    }

}
