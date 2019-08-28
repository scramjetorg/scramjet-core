const {CLIEngine} = require("eslint");
const path = require("path");
const log = require("fancy-log");

module.exports = (files = ["**/*.js"], options = {}) => (cb) => {
    const report = new CLIEngine({
        reportUnusedDisableDirectives: 1,
        cache: false,
        cwd: process.env.SCRAMJET_TEST_HOME || path.resolve(__dirname, "../../"),
        ...options
    }).executeOnFiles(files);

    for (let file of report.results) {
        if (file.errorCount || file.warningCount) {
            log.error(`Eslint errors in ${file.filePath}:`);
            file.messages.forEach(
                ({ruleId, message, line}) => log.error(` -> ${file.filePath}:${line} ${message} (${ruleId})`)
            );
        } else {
            log.info(`File "${file.filePath}" linted correctly.`);
        }
    }

    if (report.fixableErrorCount || report.fixableWarningCount) {
        log.info("Some eslint errors may be fixable, run `npm fix`");
    }

    if (report.errorCount || report.warningCount)
        return cb(new Error("Lint errors or warnings found."));

    cb();
};
