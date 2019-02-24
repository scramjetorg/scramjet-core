const gulp = require("gulp");
const DataStream = require("../../");
const nodeunit = require("nodeunit");
const {promisify} = require("util");

module.exports = function testLegacy(src, cfg = {reporter: "default", reporterOpts: {}}) {
    const reporter = nodeunit.reporters[cfg.reporter] || require(cfg.reporter);
    const cache = Object.keys(require.cache).reduce((acc, k) => (acc[k] = true, acc));

    return () => DataStream.from(gulp.src(src))
        .map(file => file.path)
        .toArray()
        .then(files => promisify(reporter.run)(files, cfg.reporterOpts))
        .then(
            () => {
                // Delete any modules that were added to the require cache
                Object.keys(require.cache).filter(function (k) {
                    return !cache[k];
                }).forEach(function (k) {
                    delete require.cache[k];
                });
            }
        );
};
