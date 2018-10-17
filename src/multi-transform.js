/* eslint require-jsdoc:0 */

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

    set options({maxParallel}) {
        this._maxParallel = +maxParallel;
    }

    pushTransform(transform) {
        const idx = ++ this._seq;
        this.transforms[idx] = {transform};
        this._rebuild();

        return {idx};
    }

    _rebuild() {

    }

    generateReadImpl({idx}, hook) {
        return async function(length) {

            return length;
        };
    }

    generateWriteImpl() {
        return async function() {

        };
    }

}
