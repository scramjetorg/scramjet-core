const gulp = require("gulp");
const through2 = require("through2");
const nodeunit = require("nodeunit");
const baseReporterOpts = require("nodeunit/bin/nodeunit.json");

const runner = (options) => {

    const files = [];


    const cache = {};


    const config = Object.assign({
        reporter: "default"
    }, options);
    const reporterOpts = Object.assign({}, baseReporterOpts, config.reporterOptions);

    const reporter = nodeunit.reporters[config.reporter] || require(config.reporter);

    // Save a copy of the require cache before testing
    Object.keys(require.cache).forEach(function(k) {
        cache[k] = true;
    });

    return through2.obj(
        function(file, enc, done) {
            files.push(file.path);
            done();
        },
        function(done) {
            reporter.run(files, reporterOpts, function(err) {
                // Delete any modules that were added to the require cache
                Object.keys(require.cache).filter(function(k) {
                    return !cache[k];
                }).forEach(function(k) {
                    delete require.cache[k];
                });

                done(err);
            });
        }
    );
};

module.exports = function testLegacy(src) {
    return function() {
        return gulp.src(src)
            .pipe(runner({
                reporter: "verbose"
            }));
    };
};
