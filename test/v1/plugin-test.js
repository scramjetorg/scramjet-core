let xSymbol = Symbol("x");
let cnt = 0;

let addX = function addX(test) { test.equals(this[xSymbol], xSymbol, "this must point to the stream context"); return this; };

const {DataStream, StringStream, staticValue} = require(process.env.SCRAMJET_TEST_HOME || "../../").plugin(
    {
        staticValue: xSymbol,
        DataStream: {
            constructor() {
                cnt++;
                this[xSymbol] = xSymbol;
            },
            addX,
            get test() {
                return xSymbol;
            }
        },
        StringStream: {
            constructor({xSymbol: optionsX}) {
                if (optionsX === xSymbol) {
                    return {
                        x: xSymbol
                    };
                }
            }
        }
    }
);

module.exports = {
    test_plugin(test) {
        test.expect(7);
        cnt = 0;

        const stream = DataStream.fromArray([1,2,3,4,5,6,7,8,9,10]);
        const stream2 = new StringStream({xSymbol});

        test.equals(staticValue, xSymbol, "DataStream must be extended");
        test.equals(stream[xSymbol], xSymbol, "DataStream must be extended");
        test.equals(stream2.x, xSymbol, "StringStream must be replaced by constructor");
        test.equals(stream.addX, addX, "DataStream must have the plugin method");
        test.equals(stream.test, xSymbol, "DataStream must have the plugin getter");
        test.equals(cnt, 2, "DataStream constructor must be called before StringStream");
        stream.addX(test);

        test.done();
    }
};
