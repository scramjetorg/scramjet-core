const {ESLint} = require("eslint");
const path = require("path");
const log = require("fancy-log");

module.exports = (files = ["**/*.js"], options = {}) => async (cb) => {
    const report = await new ESLint({
        reportUnusedDisableDirectives: "warn",
        cache: false,
        cwd: process.env.SCRAMJET_TEST_HOME || path.resolve(__dirname, "../../"),
        ...options
    })
        .lintFiles(files);

    let warningCount = 0;
    let errorCount = 0;
    for (let file of report) {
        if (file.errorCount || file.warningCount) {
            errorCount += file.errorCount;
            warningCount += file.warningCount;
            log.error(`Eslint errors in ${file.filePath}:`);
            file.messages.forEach(
                ({ruleId, message, line}) => log.error(` -> ${file.filePath}:${line} ${message} (${ruleId})`)
            );
        } else {
            log.info(`File "${file.filePath}" linted correctly.`);
        }
    }

    if (report.fixableErrorCount || report.fixableWarningCount)
        log.info("Some eslint errors may be fixable, run `npm fix`");
    
    if (warningCount)
        log.info("Some eslint warnings were found");

    if (errorCount)
        return cb(new Error("Lint errors or warnings found."));
    
    cb();
};
