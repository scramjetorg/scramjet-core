
module.exports = {
    async test_single(test) {
        test.expect(1);

        const {MultiTransform} = require("../../");

        const multi = new MultiTransform();
        multi.pushTransform((x) => x + 1);
        multi.pushTransform((x) => x + 10);

        const ret = await multi.execute(1);
        test.equals(ret, 12, "Should increment value");

        test.done();

    }
};
