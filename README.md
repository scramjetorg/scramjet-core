[![Master Build Status](https://travis-ci.org/signicode/scramjet-core.svg?branch=master)](https://travis-ci.org/signicode/scramjet-core)
[![Develop Build Status](https://travis-ci.org/signicode/scramjet-core.svg?branch=develop)](https://travis-ci.org/signicode/scramjet-core)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsignicode%2Fscramjet-core.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsignicode%2Fscramjet-core?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io/test/github/signicode/scramjet-core/badge.svg)](https://snyk.io/test/github/signicode/scramjet-core)

Scramjet core
===============

This is the minimal, dependency free version of [`scramjet`](https://github.com/signicode/scramjet) used as of Scramjet
version 3.0.0 as a base for `scramjet` and scramjet plugins.

Unless you are sure, you should be better off with using the main repo and module.

It is built upon the logic behind three well known javascript array operations - namingly map, filter and reduce. This
means that if you've ever performed operations on an Array in JavaScript - you already know Scramjet like the back of
your hand.

## Usage

Scramjet uses functional programming to run transformations on your data streams in a fashion very similar to the well
known event-stream node module. Most transformations are done by passing a transform function.

It's all about chaining, really - you develop your flow based on a chain of calls that return another method like this:

```javascript
    scramjet.from(someReadableStream)           // you can construct your stream any way you like
        .map(someMapper)                        // you can map the objects in the stream
        .map(someAsyncAPICall)                  // you can call an API for each item
        .filter(asynchronousFilterOperation)    // you can even filter by async function
        .catch(errorHandler)                    // there's built in error handling
        .until(doneCondition)                   // you can stop reading the stream whenever you're done
        .toArray();                             // you can accumulate
```

You can write your transforms in three ways:

1. Synchronous

 Example: a simple stream transform that outputs a stream of objects of the same id property and the length of the value string.

 ```javascript
    datastream.map(
        (item) => ({id: item.id, length: item.value.length})
    )
 ```

1. Asynchronous using ES2015 async await

Example: A simple stream that uses Fetch API to get all the contents of all entries in the stream

```javascript
    datastream.map(
        async (item) => fetch(item)
    )
```

1. Asynchronous using Promises

 Example: A simple stream that fetches an url mentioned in the incoming object

 ```javascript
    datastream.map(
        (item) => new Promise((resolve, reject) => {
            request(item.url, (err, res, data) => {
                if (err)
                    reject(err); // will emit an "error" event on the stream
                else
                    resolve(data);
            });
        })
    )
 ```

The actual logic of this transform function is as if you passed your function to the ```then``` method of a Promise
resolved with the data from the input stream.

## API Docs

Here's the list of the exposed classes and methods, please review the specific documentation for details:

* [`exports`](docs/index.md) - module exports explained
* [`scramjet.DataStream`](docs/data-stream.md) - the base class for all scramjet classes.
* [`scramjet.BufferStream`](docs/buffer-stream.md) - a DataStream of Buffers.
* [`scramjet.StringStream`](docs/string-stream.md) - a DataStream of Strings.
* [`scramjet.MultiStream`](docs/multi-stream.md) - a DataStream of Strings.
* [more on plugins](docs/plugins.md) - a description and link.

Note that:

* Most of the methods take a callback argument that operates on the stream items.
* The callback, unless it's stated otherwise, will receive an argument with the next chunk.
* You can use `async` functions or return `Promise`s wherever you like.
* Methods usually return the same class, so are chainable `↺` or are asynchronous `⇄`

The quick reference of the exposed classes:

### :BufferStream
A facilitation stream created for easy splitting or parsing buffers.

Useful for working on built-in Node.js streams from files, parsing binary formats etc.

A simple use case would be:

```javascript
 fs.createReadStream('pixels.rgba')
     .pipe(new BufferStream)         // pipe a buffer stream into scramjet
     .breakup(4)                     // split into 4 byte fragments
     .parse(buffer => [
         buffer.readInt8(0),            // the output is a stream of R,G,B and Alpha
         buffer.readInt8(1),            // values from 0-255 in an array.
         buffer.readInt8(2),
         buffer.readInt8(3)
     ]);
```

[Detailed :BufferStream docs here](docs/buffer-stream.md)

**Most popular methods:**

* `new BufferStream([opts])` - Creates the BufferStream
* [`bufferStream.shift(chars, func) ↺`](docs/buffer-stream.md#module_scramjet.BufferStream+shift) - Shift given number of bytes from the original stream
* [`bufferStream.split(splitter) : BufferStream ↺`](docs/buffer-stream.md#module_scramjet.BufferStream+split) - Splits the buffer stream into buffer objects
* [`bufferStream.breakup(number) : BufferStream ↺`](docs/buffer-stream.md#module_scramjet.BufferStream+breakup) - Breaks up a stream apart into chunks of the specified length
* [`bufferStream.stringify([encoding]) : StringStream`](docs/buffer-stream.md#module_scramjet.BufferStream+stringify) - Creates a string stream from the given buffer stream
* [`bufferStream.parse(parser) : DataStream`](docs/buffer-stream.md#module_scramjet.BufferStream+parse) - Parses every buffer to object
* [`BufferStream:pipeline(readable) : BufferStream`](docs/buffer-stream.md#module_scramjet.BufferStream.pipeline) - Creates a pipeline of streams and returns a scramjet stream.
* [`BufferStream:from(stream, [options]) : BufferStream`](docs/buffer-stream.md#module_scramjet.BufferStream.from) - Create BufferStream from anything.

### :DataStream
DataStream is the primary stream type for Scramjet. When you parse your
stream, just pipe it you can then perform calculations on the data objects
streamed through your flow.

Use as:

```javascript
const { DataStream } = require('scramjet');

await (DataStream.from(aStream) // create a DataStream
    .map(findInFiles)           // read some data asynchronously
    .map(sendToAPI)             // send the data somewhere
    .run());                    // wait until end
```

[Detailed :DataStream docs here](docs/data-stream.md)

**Most popular methods:**

* `new DataStream([opts])` - Create the DataStream.
* [`dataStream.map(func, [ClassType]) ↺`](docs/data-stream.md#module_scramjet.DataStream+map) - Transforms stream objects into new ones, just like Array.prototype.map
* [`dataStream.filter(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+filter) - Filters object based on the function outcome, just like Array.prototype.filter.
* [`dataStream.reduce(func, into) ⇄`](docs/data-stream.md#module_scramjet.DataStream+reduce) - Reduces the stream into a given accumulator
* [`dataStream.do(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+do) - Perform an asynchronous operation without changing or resuming the stream.
* [`dataStream.all(functions) ↺`](docs/data-stream.md#module_scramjet.DataStream+all) - Processes a number of functions in parallel, returns a stream of arrays of results.
* [`dataStream.race(functions) ↺`](docs/data-stream.md#module_scramjet.DataStream+race) - Processes a number of functions in parallel, returns the first resolved.
* [`dataStream.unorder(func)`](docs/data-stream.md#module_scramjet.DataStream+unorder) - Allows processing items without keeping order
* [`dataStream.into(func, into) ↺`](docs/data-stream.md#module_scramjet.DataStream+into) - Allows own implementation of stream chaining.
* [`dataStream.use(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+use) - Calls the passed method in place with the stream as first argument, returns result.
* [`dataStream.run() ⇄`](docs/data-stream.md#module_scramjet.DataStream+run) - Consumes all stream items doing nothing. Resolves when the stream is ended.
* [`dataStream.tap() ↺`](docs/data-stream.md#module_scramjet.DataStream+tap) - Stops merging transform Functions at the current place in the command chain.
* [`dataStream.whenRead() ⇄`](docs/data-stream.md#module_scramjet.DataStream+whenRead) - Reads a chunk from the stream and resolves the promise when read.
* [`dataStream.whenWrote(chunk) ⇄`](docs/data-stream.md#module_scramjet.DataStream+whenWrote) - Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
* [`dataStream.whenEnd() ⇄`](docs/data-stream.md#module_scramjet.DataStream+whenEnd) - Resolves when stream ends - rejects on uncaught error
* [`dataStream.whenDrained() ⇄`](docs/data-stream.md#module_scramjet.DataStream+whenDrained) - Returns a promise that resolves when the stream is drained
* [`dataStream.whenError() ⇄`](docs/data-stream.md#module_scramjet.DataStream+whenError) - Returns a promise that resolves (!) when the stream is errors
* [`dataStream.setOptions(options) ↺`](docs/data-stream.md#module_scramjet.DataStream+setOptions) - Allows resetting stream options.
* [`dataStream.copy(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+copy) - Returns a copy of the stream
* [`dataStream.tee(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+tee) - Duplicate the stream
* [`dataStream.each(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+each) - Performs an operation on every chunk, without changing the stream
* [`dataStream.while(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+while) - Reads the stream while the function outcome is truthy.
* [`dataStream.until(func) ↺`](docs/data-stream.md#module_scramjet.DataStream+until) - Reads the stream until the function outcome is truthy.
* [`dataStream.catch(callback) ↺`](docs/data-stream.md#module_scramjet.DataStream+catch) - Provides a way to catch errors in chained streams.
* [`dataStream.raise(err) ⇄`](docs/data-stream.md#module_scramjet.DataStream+raise) - Executes all error handlers and if none resolves, then emits an error.
* [`dataStream.bufferify(serializer) : BufferStream ↺`](docs/data-stream.md#module_scramjet.DataStream+bufferify) - Creates a BufferStream.
* [`dataStream.stringify([serializer]) : StringStream ↺`](docs/data-stream.md#module_scramjet.DataStream+stringify) - Creates a StringStream.
* [`dataStream.toArray([initial]) : Array.<any> ⇄`](docs/data-stream.md#module_scramjet.DataStream+toArray) - Aggregates the stream into a single Array
* [`dataStream.toGenerator() : Generator.<Promise.<any>>`](docs/data-stream.md#module_scramjet.DataStream+toGenerator) - Returns an async generator
* [`dataStream.toBufferStream(serializer) : BufferStream ↺`](docs/data-stream.md#module_scramjet.DataStream+toBufferStream) - Creates a BufferStream.
* [`dataStream.toStringStream([serializer]) : StringStream ↺`](docs/data-stream.md#module_scramjet.DataStream+toStringStream) - Creates a StringStream.
* [`dataStream.toBufferStream(serializer) : BufferStream ↺`](docs/data-stream.md#module_scramjet.DataStream+toBufferStream) - Creates a BufferStream.
* [`dataStream.toStringStream([serializer]) : StringStream ↺`](docs/data-stream.md#module_scramjet.DataStream+toStringStream) - Creates a StringStream.
* [`DataStream:from(input, [options]) : DataStream`](docs/data-stream.md#module_scramjet.DataStream.from) - Returns a DataStream from pretty much anything sensibly possible.
* [`DataStream:pipeline(readable) : DataStream`](docs/data-stream.md#module_scramjet.DataStream.pipeline) - Creates a pipeline of streams and returns a scramjet stream.
* [`DataStream:fromArray(array, [options]) : DataStream`](docs/data-stream.md#module_scramjet.DataStream.fromArray) - Create a DataStream from an Array
* [`DataStream:fromIterator(iterator, [options]) : DataStream`](docs/data-stream.md#module_scramjet.DataStream.fromIterator) - Create a DataStream from an Iterator

### :MultiStream
An object consisting of multiple streams than can be refined or muxed.

The idea behind a MultiStream is being able to mux and demux streams when needed.

Usage:
```javascript
new MultiStream([...streams])
 .mux();

new MultiStream(function*(){ yield* streams; })
 .map(stream => stream.filter(myFilter))
 .mux();
```

[Detailed :MultiStream docs here](docs/multi-stream.md)

**Most popular methods:**

* `new MultiStream(streams, [options])` - Crates an instance of MultiStream with the specified stream list
* [`multiStream.streams : Array`](docs/multi-stream.md#module_scramjet.MultiStream+streams) - Array of all streams
* [`multiStream.source : DataStream`](docs/multi-stream.md#module_scramjet.MultiStream+source) - Source of the MultiStream.
* [`multiStream.length : number`](docs/multi-stream.md#module_scramjet.MultiStream+length) - Returns the current stream length
* [`multiStream.map(aFunc, rFunc) : Promise.<MultiStream> ↺`](docs/multi-stream.md#module_scramjet.MultiStream+map) - Returns new MultiStream with the streams returned by the transform.
* [`multiStream.find() : DataStream`](docs/multi-stream.md#module_scramjet.MultiStream+find) - Calls Array.prototype.find on the streams
* [`multiStream.filter(func) : MultiStream ↺`](docs/multi-stream.md#module_scramjet.MultiStream+filter) - Filters the stream list and returns a new MultiStream with only the
* [`multiStream.mux([comparator], [ClassType]) : DataStream`](docs/multi-stream.md#module_scramjet.MultiStream+mux) - Muxes the streams into a single one
* [`multiStream.add(stream)`](docs/multi-stream.md#module_scramjet.MultiStream+add) - Adds a stream to the MultiStream
* [`multiStream.remove(stream)`](docs/multi-stream.md#module_scramjet.MultiStream+remove) - Removes a stream from the MultiStream
* [`MultiStream:from(streams, [StreamClass]) : MultiStream`](docs/multi-stream.md#module_scramjet.MultiStream.from) - Constructs MultiStream from any number of streams-likes

### :StringStream
A stream of string objects for further transformation on top of DataStream.

Example:

```js
StringStream.from(async () => (await fetch('https://example.com/data/article.txt')).text())
    .lines()
    .append("\r\n")
    .pipe(fs.createWriteStream('./path/to/file.txt'))
```

[Detailed :StringStream docs here](docs/string-stream.md)

**Most popular methods:**

* `new StringStream([encoding], [options])` - Constructs the stream with the given encoding
* [`stringStream.shift(bytes, func) ↺`](docs/string-stream.md#module_scramjet.StringStream+shift) - Shifts given length of chars from the original stream
* [`stringStream.split(splitter) ↺`](docs/string-stream.md#module_scramjet.StringStream+split) - Splits the string stream by the specified RegExp or string
* [`stringStream.match(matcher) ↺`](docs/string-stream.md#module_scramjet.StringStream+match) - Finds matches in the string stream and streams the match results
* [`stringStream.toBufferStream() : BufferStream ↺`](docs/string-stream.md#module_scramjet.StringStream+toBufferStream) - Transforms the StringStream to BufferStream
* [`stringStream.parse(parser, [StreamClass]) : DataStream ↺`](docs/string-stream.md#module_scramjet.StringStream+parse) - Parses every string to object
* [`stringStream.toDataStream()`](docs/string-stream.md#module_scramjet.StringStream+toDataStream) - Alias for {@link StringStream#parse}
* [`StringStream:SPLIT_LINE`](docs/string-stream.md#module_scramjet.StringStream.SPLIT_LINE) - A handy split by line regex to quickly get a line-by-line stream
* [`StringStream:fromString(stream, encoding) : StringStream`](docs/string-stream.md#module_scramjet.StringStream.fromString) - Creates a StringStream and writes a specific string.
* [`StringStream:pipeline(readable, transforms) : StringStream`](docs/string-stream.md#module_scramjet.StringStream.pipeline) - Creates a pipeline of streams and returns a scramjet stream.
* [`StringStream:from(source, [options]) : StringStream`](docs/string-stream.md#module_scramjet.StringStream.from) - Create StringStream from anything.



## CLI

Check out the command line interface for simplified scramjet usage with [scramjet-cli](https://www.npmjs.com/package/scramjet-cli)

    $ sjr -i http://datasource.org/file.csv ./transform-module-1 ./transform-module-1 | gzip > logs.gz

## License and contributions

As of version 2.0 Scramjet is MIT Licensed.

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsignicode%2Fscramjet-core.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsignicode%2Fscramjet-core?ref=badge_large)

## Help wanted

The project need's your help! There's lots of work to do - transforming and muxing, joining and splitting, browserifying, modularizing, documenting and issuing those issues.

If you want to help and be part of the Scramjet team, please reach out to me, signicode on Github or email me: scramjet@signicode.com.
