"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

const _require = require(process.env.SCRAMJET_TEST_HOME || "../../"),
      DataStream = _require.DataStream;

const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]; // ------- stream sources -------

const sources = {
  simple_error: ref => DataStream.from(arr).map(x => {
    if (x === 84) throw ref.thrown = new Error("Eight and fourty");
    return {
      x
    };
  }),
  sync_iterator_and_items: ref => DataStream.from({
    [Symbol.iterator]: function* () {
      yield* arr.slice(0, 84).map(x => ({
        x
      }));
      yield Promise.reject(ref.thrown = new Error("Eight and fourty"));
      yield* arr.slice(85).map(x => ({
        x
      }));
    }
  }),
  sync_iterator_async_items: ref => DataStream.from({
    [Symbol.iterator]: function* () {
      yield* arr.slice(0, 84).map(x => new Promise(res => res({
        x
      })));
      yield new Promise((res, rej) => rej(ref.thrown = new Error("Eight and fourty")));
      yield* arr.slice(85).map(x => new Promise(res => res({
        x
      })));
    }
  })
}; // ------- stream transform types -------

const transforms = {
  none: stream => stream,
  piped: stream => stream.pipe(new DataStream()).map(({
    x
  }) => ({
    a: 1,
    x
  })),
  tapped: stream => stream.tap().map(({
    x
  }) => ({
    a: 1,
    x
  })),
  mergeable: stream => stream.map(({
    x
  }) => ({
    a: 1,
    x
  }))
}; // ------- stream error handling tests -------

const tests = {
  entry_count: (errorStream, transform, test) => {
    test.plan(1);
    const ref = {
      thrown: {}
    };
    return errorStream(ref).use(transform, ref).catch(() => undefined).toArray().then(arr => test.equals(arr.length, 99, "Should contain one less item"), () => test.ok(false, "Should not reject if error was handled")).then(() => test.end());
  },
  in_promise: (errorStream, transform, test) => {
    test.plan(2);
    const ref = {
      thrown: {}
    };
    return errorStream(ref).use(transform, ref).run().catch(e => {
      test.equals(e.cause, ref.thrown, "Should throw the wrapped error");
      test.equals(e.cause.message, "Eight and fourty", "Should convey the message");
    }).then(() => test.end());
  },
  in_catch: (errorStream, transform, test) => {
    test.plan(2);
    const ref = {
      thrown: {}
    };
    return errorStream(ref).use(transform, ref).catch(e => {
      test.equals(e.cause, ref.thrown, "Should throw the wrapped error");
      test.equals(e.cause.message, "Eight and fourty", "Should convey the message");
    }).run().catch(() => test.ok(false, "Must not call catch if error already caught")).then(() => test.end());
  },
  in_handler: (errorStream, transform, test) => {
    test.plan(1);
    const ref = {
      thrown: {}
    };
    return errorStream(ref).use(transform, ref).run().then(() => test.ok(false, "Should not resolve if error was unhandled"), () => test.ok(true, "Must not call catch if error already caught")).then(() => test.end());
  }
}; // ------- Other cases -------

const otherTests = {
  failing_iterator_accessor(test) {
    test.plan(2);
    let thrown;
    return DataStream.from({
      [Symbol.iterator]: function () {
        throw thrown = new Error("Not even one");
      }
    }).run().catch(e => {
      test.equals(e.cause, thrown, "Should throw the wrapped error");
      test.equals(e.cause.message, "Not even one", "Should convey the message");
    }).then(() => test.end());
  },

  failing_generator(test) {
    test.plan(2);
    let thrown;
    return DataStream.from(function* () {
      yield 1;
      throw thrown = new Error("All but one");
    }).run().catch(e => {
      test.equals(e.cause, thrown, "Should throw the wrapped error");
      test.equals(e.cause.message, "All but one", "Should convey the message");
    }).then(() => test.end());
  }

}; // ------- Output -------

module.exports = Array.from(function* genRet() {
  var _arr = Object.entries(sources);

  for (var _i = 0; _i < _arr.length; _i++) {
    let _arr$_i = _slicedToArray(_arr[_i], 2),
        sourceName = _arr$_i[0],
        sourceFunction = _arr$_i[1];

    var _arr2 = Object.entries(transforms);

    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      let _arr2$_i = _slicedToArray(_arr2[_i2], 2),
          transformName = _arr2$_i[0],
          transformFunction = _arr2$_i[1];

      var _arr3 = Object.entries(tests);

      for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
        let _arr3$_i = _slicedToArray(_arr3[_i3], 2),
            testName = _arr3$_i[0],
            testFunction = _arr3$_i[1];

        yield [`source:${sourceName} transform:${transformName} test:${testName}`, test => testFunction(sourceFunction, transformFunction, test)];
      }
    }
  }
}()).concat(Object.entries(otherTests)).reduce((acc, [k, v]) => (acc[k] = v, acc), {});