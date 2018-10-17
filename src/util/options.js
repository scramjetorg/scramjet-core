const {EventEmitter} = require("events");
const _declarations = Symbol("declarations");
const _values = Symbol("values");
const _chain = Symbol("chain");
const _owner = Symbol("owner");

const isClass = (cls) => cls && typeof cls === "function" && cls.prototype.constructor === cls && cls !== Object;
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
    if (!isClass(cls))
        throw new Error("Cannot get options declaration for a non-constructor");


    if (map.has(cls))
        return map.get(cls);

    const superClass = _superClass(cls);
    const parent = isClass(superClass) ? findProxyForClass(map, superClass) : null;

    const declaration = inheritedProxy(parent);
    map.set(cls, declaration);

    return declaration;
};

const DefaultDefinition = {};

/**
 * Scramjet options for streams
 */
export class ScramjetOptions extends EventEmitter {

    /**
     * Constructor of the options class
     *
     * @param {PromiseTransformStream} owner the options object parent
     * @param {ScramjetOptions} chain previous options
     * @param {ScramjetOptions} initial initial options
     */
    constructor(owner, chain, initial) {
        super();
        this[_owner] = owner;
        this[_chain] = chain;
        this[_declarations] = findProxyForInstance(this, owner);
        this[_values] = {};
        Object.assign(this[_values], initial);
    }

    /**
     * Getter for proxy object
     *
     * @returns {Proxy} options proxy object
     */
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
                if (key in target[_values])
                    return {
                        value: this.get(target, key),
                        enumerable: true,
                        configurable: true,
                        writable: true
                    };

                return null;
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

        Object.defineProperty(this, "proxy", {value});
        return value;
    }

    /**
     * Declares a usable option.
     *
     * @param {Function<PromiseTransformStream>} cls class derived from PTS
     * @param {String} name configuration entry name
     * @param {Object} definition definition of the option
     */
    static declare(cls, name, {chained = false, value} = DefaultDefinition) {
        this[_declarations] = this[_declarations] || new Map();
        const optionsList = findProxyForClass(this[_declarations], cls);

        optionsList[name] = {chained, value};
    }

}
