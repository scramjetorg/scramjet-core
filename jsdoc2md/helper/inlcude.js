
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

const { anchorName } = require('dmd/helpers/ddata');
exports.detailHref = function(options) {
    if (!this.meta || !this.meta.filename)
        return options.fn(this);
    return `[${options.fn(this)}](docs/${this.meta.filename.replace(/\.[\w]+$/, '.md')}#${anchorName.call(this)})`;
};

exports.inlineReturnTypes = function(types) {
    return types.join(' \| ');
};

exports.inspect = function() {
    console.log(this);
}
