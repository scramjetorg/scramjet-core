const {MultiTransform} = require("../..");

module.exports = {
    async test_single(test) {
        test.expect(1);

        const multi = new MultiTransform();
        multi.pushTransform((x) => x + 1);
        multi.pushTransform((x) => x + 10);

        const ret = await multi.execute(1);
        test.equals(ret, 12, "Should increment value");

        test.done();
    }
    // ,
    // async test_hook(test) {
    //     const multi = new MultiTransform({followOrder: true});
    //     const defer = (ms = 0) => new Promise((res) => setTimeout(() => res(ms), ms));

    //     const tf1 = multi.pushTransform((x) => defer(x));
    //     multi.pushTransform((x) => defer(x));
    //     multi.pushHook(tf1, (x) => console.log("aaaa", x));
    //     const tf2 = multi.pushTransform((x) => defer(x));
    //     multi.pushHook(tf2, (x) => console.log("bbbb", x));

    //     console.log(await Promise.all([
    //         multi.execute(20),
    //         multi.execute(10)
    //     ]));

    //     test.done();
    // }
};
