const DataStream = require(process.env.SCRAMJET_TEST_HOME || "../").DataStream;

const defer = (ms = 20) => new Promise(res => setTimeout(res, ms));
const str = new DataStream();

str.write({x: 1});
str.write({x: 2});
str.write({x: 3});
str.write({x: 4});
str.write({x: 5});
str.write({x: 6});
str.write({x: 7});
str.write({x: 8});
str.write({x: 9});
str.write({x: 10});
str.write({x: 11});
str.write({x: 12});
str.write({x: 13});
str.write({x: 14});
str.write({x: 15});
str.write({x: 16});
str.write({x: 17});
str.write({x: 18});

str.whenWrote({x: 19})
    .then(() => {
        str.write({ x: 20 });
        str.write({ x: 21 });
        str.write({ x: 22 });
        str.write({ x: 23 });
        str.write({ x: 24 });
        str.write({ x: 25 });
        str.write({ x: 26 });
        str.write({ x: 27 });
        str.write({ x: 28 });
        str.write({ x: 29 });
        str.end({ x: 30 });
    });

process.on("unhandledRejection", e => {
    console.error("e", e.stack);
});

let erd = str
    .map(({x}) => defer((x % 4)*10).then(() => ({x, mod: x % 4})))
    .each(x => console.log(x));

// erd.on("end", () => console.log('end'))
erd
    .on("end", () => console.log("end"));
