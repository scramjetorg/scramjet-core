"use strict";

const _require = require("eslint"),
      CLIEngine = _require.CLIEngine;

const path = require("path");

const log = require("fancy-log");

module.exports = (files = ["**/*.js"]) => cb => {
  const report = new CLIEngine({
    reportUnusedDisableDirectives: 1,
    cache: true,
    cwd: path.resolve(__dirname, "../../")
  }).executeOnFiles(files);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = report.results[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      let file = _step.value;

      if (file.errorCount || file.warningCount) {
        log.error(`Eslint errors in ${file.filePath}:`);
        file.messages.forEach(({
          ruleId,
          message,
          line
        }) => log.error(` -> ${file.filePath}:${line} ${message} (${ruleId})`));
      } else {
        log.info(`File "${file.filePath}" linted correctly.`);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  if (report.fixableErrorCount || report.fixableWarningCount) {
    log.info("Some eslint errors may be fixable, run `npm fix`");
  }

  if (report.errorCount || report.warningCount) return cb(new Error("Lint errors or warnings found."));
  cb();
};