module.exports = function() {
    return {
        partial: __dirname + "/partial-docs/*.hbs",
        helper: __dirname + "/helper/*.js"
    };
};
