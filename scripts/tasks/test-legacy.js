const gulp = require("gulp");
const DataStream = require("scramjet");

module.exports = function testLegacy(src) {
    return function () {
        return DataStream.from(gulp.src(src))
            .use("nodeunit-tape-compat", { timeout: 5000 })
            .run();
    };
};
