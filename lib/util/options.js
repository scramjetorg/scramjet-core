const { EventEmitter } = require("events");
const _declarations = Symbol("declarations");
const _values = Symbol("values");
const _chain = Symbol("chain");
const _owner = Symbol("owner");

const isClass = cls => cls && typeof cls === "function" && cls.prototype.constructor === cls && cls !== Object;
const _superClass = (cls) => {
    return isClass(cls) && cls.prototype.__proto__ && cls.prototype.__proto__.constructor;
};

const inheritedProxy = (parent) => {
    return new Proxy({}, {
        has(target, prop) {
            return prop in target || parent && prop in parent;
        },
        get(target, prop) {
            if (prop in target)
                return target[prop];

            return parent && parent[prop];
        },
        set(target, prop, value) {
            if (prop in target)
                throw new Error(`Option "${prop}" already defined`);

            target[prop] = value;
            return true;
        }
    });
};

const findProxyForInstance = (ref, instance) => {
    return findProxyForClass(ref.__proto__.constructor[_declarations], instance.__proto__.constructor);
};

const findProxyForClass = (map, cls) => {
    if (!isClass(cls)) {
        throw new Error("Cannot get options declaration for a non-constructor");
    }

    if (map.has(cls))
        return map.get(cls);

    const superClass = _superClass(cls);
    const parent = isClass(superClass) ? findProxyForClass(map, superClass) : null;

    const declaration = inheritedProxy(parent);
    map.set(cls, declaration);

    return declaration;
};

const DefaultDefinition = {};


class FrozenOptionOverrideError extends Error {
    constructor(owner, name, value) {
        super(`Attempt to override frozen option "${name}"`);
        this.owner = owner;
        this.name = name;
        this.value = value;
    }
}

/**
 * Scramjet options for streams
 */
module.exports = class ScramjetOptions extends EventEmitter {
    /**
     *
     * @param {PromiseTransformStream} owner
     * @param {ScramjetOptions} chain
     */
    constructor(owner, chain, initial) {
        super();
        this[_owner] = owner;
        this[_chain] = chain;
        this[_declarations] = findProxyForInstance(this, owner);
        this[_values] = {};
        Object.assign(this[_values], initial);
    }

    get proxy() {
        const value = new Proxy(this, {
            has(target, key) {
                if (!(key in target[_declarations]))
                    return false;
                return key in target[_values] || target[_declarations][key].value;
            },
            ownKeys(target) {
                return Object.keys(target[_values]);
            },
            getOwnPropertyDescriptor(target, key) {
                if (key in target[_values]) {
                    return {
                        value: this.get(target, key),
                        enumerable: true,
                        configurable: true,
                        writable: true
                    };
                }
            },
            get(target, key) {
                if (key in target[_declarations]) {
                    if (key in target[_values])
                        return target[_values][key];

                    if (target[_chain] && target[_declarations][key].chained && target[_chain].hasOwnProperty(key))
                        return target[_chain][key];

                    return target[_declarations][key].value;
                }

                throw new Error(`Attempting to access undeclared option: ${key}`);
            },
            set(target, key, value) {
                if (key in target[_declarations]) {
                    target[_values][key] = value;
                    return;
                }

                throw new Error(`Attempting to set undeclared option: ${key}`);
            }
        });

        Object.defineProperty(this, "proxy", { value });
        return value;
    }

    /**
     * Definition of a declaration of a single scramjet option.
     *
     * @typedef ScramjetOptionDefinition
     * @prop {boolean} [chained=false] should it be chained from referred options
     * @prop {boolean} [freeze=false] make the options non-overridable in chain (will throw error)
     * @prop {*} [value=undefined] the default value
     */

    /**
     * Declares a usable option.
     *
     * @param {Function<PromiseTransformStream>} cls
     * @param {string} name
     * @param {ScramjetOptionDefinition} definition
     */
    static declare(cls, name, { chained = false, freeze = false, value } = DefaultDefinition) {
        this[_declarations] = this[_declarations] || new Map();
        const optionsList = findProxyForClass(this[_declarations], cls);

        if (freeze && !chained)
            throw new Error(`Option "${name}" cannot be frozen, because it's chained.`);

        optionsList[name] = { chained, freeze, value };
    }

    /**
     * Exposes error on override of frozen option
     */
    static get FrozenOptionOverrideError() { return FrozenOptionOverrideError; }

};
