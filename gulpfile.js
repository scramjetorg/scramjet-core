/* eslint-disable node/no-unpublished-require */

const gulp = require("gulp");
const path = require("path");

const ver = (process.env.FORCE_NODE_VERSION || process.version).slice(1).split(".");
const base = +ver[0] > 8 && +ver[1] > 3 ? "./" : "./v6/";
const {transpile, lint, test_legacy, readme, docs, scm_clean}
    = require(base + "scripts/tasks");

gulp.task("lint", lint());
gulp.task("transpile_lib", transpile("lib/**/*.js", "v6/lib/"));
gulp.task("transpile_test", transpile("test/**/*.js", "v6/test/"));
gulp.task("transpile_scripts", transpile("scripts/**/*.js", "v6/scripts/"));

gulp.task("test_legacy", test_legacy(base + "test/v1/*.js"));
gulp.task("readme", readme({files: ["lib/*-stream.js"], plugin: "jsdoc2md/plugin.js" }, path.join(__dirname, "README.md")));
gulp.task("make_docs", docs("lib/*.js", {plugin: "jsdoc2md/plugin-docs.js"}, "docs/"));

gulp.task("test", gulp.series("lint", "test_legacy"));
gulp.task("docs", gulp.series("readme", "make_docs"));

gulp.task("scm_clean", gulp.series("docs", scm_clean()));

gulp.task("transpile", gulp.series("transpile_lib", "transpile_test", "transpile_scripts"));
gulp.task("default", gulp.series("lint", "docs", "transpile", "test_legacy"));
gulp.task("prerelease", gulp.series("default", "scm_clean"));
