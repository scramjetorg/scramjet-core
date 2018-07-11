const {ScramjetOptions} = require(process.env.SCRAMJET_TEST_HOME || "../../");

class A {
    constructor(ref) {
        this._options = new ScramjetOptions(this, ref, {option0: -1});
    }

    get options() {
        return this._options.proxy;
    }
}

class B extends A {}

ScramjetOptions.declare(A, "option0", {chained: true});

module.exports = {
    test_declare: {
        single(test) {
            test.equal();
            test.doesNotThrow(() => {
                ScramjetOptions.declare(A, "option1");
                ScramjetOptions.declare(A, "option2", {value: 1});
            });
            test.done();
        },
        chained(test) {
            test.doesNotThrow(() => {
                ScramjetOptions.declare(A, "option3", {chained: true});
                ScramjetOptions.declare(A, "option4", {chained: true, value: 2});

                ScramjetOptions.declare(A, "option5", {chained: true, value: 3});
                ScramjetOptions.declare(B, "option5", {chained: true, value: 4});

                ScramjetOptions.declare(B, "option6", {chained: true});
                ScramjetOptions.declare(B, "option7", {chained: true, value: 5});

                ScramjetOptions.declare(B, "option8", {chained: false, value: 6});
            });
            test.done();
        }
    },
    test_read: {
        single(test) {
            const a = new A();
            test.doesNotThrow(() => {
                test.ok(!("option1" in a.options), "Should not show undefined default value.");
                test.ok("option2" in a.options, "Should show defined default value.");
                test.ok(!("option3" in a.options), "Should not have any properties from other instances");
                test.equals(typeof a.options.option1, "undefined", "'option1' should be undefined");
                test.equals(typeof a.options.option2, "number", "'option2' should be defined");
                test.equals(a.options.option2, 1, "'option2' should have the default value");
                a.options.option1 = 6;
                a.options.option2 = 7;
                test.equals(a.options.option1, 6, "'option1' setters and getters should work");
                test.equals(a.options.option2, 7, "'option2' setters and getters should work");
            }, "Does not throw on standard operations");
            test.throws(() => a.options.undef = 1, "Shoud throw on setter of undeclared item");
            test.throws(() => a.options.undef, "Shoud throw on getter of undeclared item");
            test.done();
        },
        inherited(test) {
            const b = new B();

            test.doesNotThrow(() => {
                test.ok(!("option1" in b.options), "Should not show undefined default value.");
                test.ok("option2" in b.options, "Should show defined default value.");
                b.options.option1 = 6;
                test.equals(b.options.option1, 6, "'option1' setters and getters should work");
            }, "Does not throw on standard operations");

            test.done();
        },
        chained(test) {
            const a = new A();
            const b = new B(a.options);
            const c = new B(b.options);

            test.doesNotThrow(() => {
                test.ok(!("option3" in b.options), "B should not show undefined default value.");
                test.ok("option4" in b.options, "B should show defined inherited default value.");
                test.ok(!("option7" in a.options), "A should not have any properties from the chain");

                test.equals(typeof b.options.option3, "undefined", "'option3' should be undefined");
                test.equals(typeof b.options.option4, "number", "Inherited 'option4' should be defined");
                test.equals(b.options.option4, 2, "'option4' should have the default value");

                a.options.option3 = 7;
                b.options.option4 = 8;
                test.equals(+b.options.option3, 7, "'option3' setters on A should be readable from B");
                test.equals(a.options.option4, 2, "'option4' setters on B should not affect A");

                test.equals(b.options.option5, 4, "'option5' should be overridden");
                test.equals(a.options.option5, 3, "'option5' overriding should be unaffected");

                test.ok("option7" in b.options, "'option7' should be defined");

                b.options.option7 = 9;
                b.options.option8 = 10;
                test.equals(c.options.option7, 9, "'option7' setters on A should be readable from B");
                test.equals(c.options.option8, 6, "'option8' setters on B should not affect A");

            }, "Does not throw on standard operations");

            test.done();
        }
    }
};
