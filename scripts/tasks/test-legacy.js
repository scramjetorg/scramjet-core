const gulp = require("gulp");
const DataStream = require("scramjet");

module.exports = function testLegacy(src, cfg = {}) {
    return function () {
        return DataStream.from(gulp.src(src))
            .use("nodeunit-tape-compat", Object.assign({ timeout: 5000 }, cfg))
            .run();
    };
};
