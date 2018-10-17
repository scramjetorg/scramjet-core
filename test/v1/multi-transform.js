
const {MultiTransform} = require("../../");

module.exports = {
    async test_single(test) {
        const multi = new MultiTransform();
        multi.pushTransform((x) => x + 1);

        const ret = await multi._execute(1);
        test.equals(ret, 2, "Should increment value");
        test.done();
    }
};
