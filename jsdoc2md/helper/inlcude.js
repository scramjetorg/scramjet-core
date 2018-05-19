module.exports = {
    forReadme(item) {
        return this.customTags && this.customTags.find(({ tag }) => tag === 'meta.noReadme') ? item.inverse(this) : item.fn(this);
    }
}
