/* eslint-disable node/no-unpublished-require */

const gulp = require("gulp");

gulp.task("lint", require("./scripts/tasks/lint")());
gulp.task("test_legacy", require("./scripts/tasks/test-legacy")("test/v1/*.js"));
gulp.task("readme", require("./scripts/tasks/readme")({files: ["lib/data-stream.js", "lib/string-stream.js", "lib/buffer-stream.js", "lib/multi-stream.js"], plugin: "jsdoc2md/plugin.js"}));
gulp.task("docs", gulp.series("readme", require("./scripts/tasks/docs")("lib/*.js", {plugin: "jsdoc2md/plugin-docs.js"}, "docs/")));

gulp.task("scm_clean", gulp.series("docs", require("./scripts/tasks/scm-clean")));

gulp.task("test", gulp.series("lint", "test_legacy"));
gulp.task("default", gulp.series("readme", "lint", "docs", "test_legacy"));
gulp.task("prerelease", gulp.series("default", "scm_clean"));

