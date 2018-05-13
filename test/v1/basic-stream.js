const {DataStream} = require(process.env.SCRAMJET_TEST_HOME || '../../');

const arr = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
];

module.exports = {
    test_read: {
        async starve(test) {
            test.expect(2);
            const conp = arr.slice();
            const stream = new DataStream({parallelRead(many) {
                return conp.splice(0, 1);
            }});
            test.ok(stream instanceof DataStream, "Stream still implements a DataStream");
            test.deepEqual(await stream.toArray(), arr, "Stream must read the array in sync");
            test.done();
        },
        async sync(test) {
            test.expect(2);
            const conp = arr.slice();
            const stream = new DataStream({parallelRead(many) {
                return conp.splice(0, many);
            }});
            test.ok(stream instanceof DataStream, "Stream still implements a DataStream");
            test.deepEqual(await stream.toArray(), arr, "Stream must read the array in sync");
            test.done();
        },
        async async(test) {
            test.expect(2);
            const conp = arr.slice();
            const stream = new DataStream({async parallelRead(many) {
                return new Promise(res => process.nextTick(() => res(conp.splice(0, many))));
            }});
            test.ok(stream instanceof DataStream, "Stream still implements a DataStream");
            test.deepEqual(await stream.toArray(), arr, "Stream must read the array in async");
            test.done();
        }
    },
    test_transform: {
        sync(test) {
            // TODO: Implement tests here.
            test.done();
        },
        async async(test) {
            // TODO: Implement tests here.
            test.done();
        }
    }
};
