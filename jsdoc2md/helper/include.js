
exports.forReadme = function(item) {
    return this.customTags && this.customTags.find(({ tag }) => tag === 'meta.noReadme') ? item.inverse(this) : item.fn(this);
};

exports.accessSymbol = function() {
    if (this.scope === 'static') {
        return ":"
    }
    if (this.scope === 'instance') {
        return "."
    }
    if (this.scope === 'inner') {
        return "~"
    }
    return '';
}

exports.returnSymbol = function() {
    if (this.chainable)
        return "↺";
    if (this.async)
        return "⇄";

    return '';
}

exports.ifReturnSymbol = function(options) {
    if (exports.returnSymbol.call(this, options))
        return options.fn(this);
    return options.inverse(this);
}

const { anchorName, link } = require('dmd/helpers/ddata');
exports.detailHref = function(options) {
    if (!this.meta || !this.meta.filename)
        return options.fn(this);
    return `[${options.fn(this)}](docs/${this.meta.filename.replace(/\.[\w]+$/, '.md')}#${anchorName.call(this)})`;
};


/**
 * @param id {string} - the ID to link to, e.g. `external:XMLHttpRequest`, `GlobalClass#propOne` etc.
 * @static
 * @category Block helper: util
 * @example
 * {{#link "module:someModule.property"~}}
 *   {{name}} {{!-- prints 'property' --}}
 *   {{url}}  {{!-- prints 'module-someModule-property' --}}
 * {{/link}}
 */
exports.link = function (name, options) {
    if (options.data.root.fullIndex && name in options.data.root.fullIndex) {
        const found = options.data.root.fullIndex[name];
        if (found.target !== this.target) {
            const out = {
                name, url: `${options.docsBase || ''}${found.target}#${anchorName.call(found)}`
            }
            return options.fn(out)
        }
    }

    return link(name, options);
}


exports.inlineReturnTypes = function(types) {
    return types.join(' \| ');
};

exports.inspect = function() {
    console.log(this);
}
