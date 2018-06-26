/* eslint-disable node/no-unpublished-require */

const gulp = require("gulp");
const path = require("path");

const {lint, test_legacy, readme, docs, scm_clean} = require("./scripts/tasks");

gulp.task("lint", lint());
gulp.task("test_legacy", test_legacy("test/v1/*.js"));
gulp.task("readme", readme({files: ["lib/*-stream.js"], plugin: "jsdoc2md/plugin.js" }, path.join(__dirname, "README.md")));
gulp.task("make_docs", docs("lib/*.js", {plugin: "jsdoc2md/plugin-docs.js"}, "docs/"));

gulp.task("test", gulp.series("lint", "test_legacy"));
gulp.task("docs", gulp.series("readme", "make_docs"));

gulp.task("scm_clean", gulp.series("docs", scm_clean()));

gulp.task("default", gulp.series("lint", "docs", "test_legacy"));
gulp.task("prerelease", gulp.series("default", "scm_clean"));
