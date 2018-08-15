![Scramjet Logo](https://signicode.com/scramjet-logo-light.svg)

[![Master Build Status](https://travis-ci.org/signicode/scramjet-core.svg?branch=master)](https://travis-ci.org/signicode/scramjet-core)
[![Develop Build Status](https://travis-ci.org/signicode/scramjet-core.svg?branch=develop)](https://travis-ci.org/signicode/scramjet-core)
[![Dependencies](https://david-dm.org/signicode/scramjet-core/status.svg)](https://david-dm.org/signicode/scramjet-core)
[![Dev Dependencies](https://david-dm.org/signicode/scramjet-core/dev-status.svg)](https://david-dm.org/signicode/scramjet-core?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/signicode/scramjet-core/badge.svg)](https://snyk.io/test/github/signicode/scramjet-core)
[![Greenkeeper badge](https://badges.greenkeeper.io/signicode/scramjet-core.svg)](https://greenkeeper.io/)

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

### BufferStream

A factilitation stream created for easy splitting or parsing buffers.

Useful for working on built-in Node.js streams from files, parsing binary formats etc.

A simple use case would be:

```javascript
 fs.createReadStream('pixels.rgba')
     .pipe(new BufferStream)         // pipe a buffer stream into scramjet
     .breakup(4)                     // split into 4 byte fragments
     .parse(buf => [
         buf.readInt8(0),            // the output is a stream of R,G,B and Alpha
         buf.readInt8(1),            // values from 0-255 in an array.
         buf.readInt8(2),
         buf.readInt8(3)
     ]);
```

[Detailed BufferStream docs here](docs/buffer-stream.md)

**Most popular methods:**

* `new BufferStream(opts)` - Creates the BufferStream
* [`bufferStream.shift(chars, func) : BufferStream ↺`](docs/buffer-stream.md#BufferStream+shift) - Shift given number of bytes from the original stream
* [`bufferStream.split(splitter) : BufferStream ↺`](docs/buffer-stream.md#BufferStream+split) - Splits the buffer stream into buffer objects
* [`bufferStream.breakup(number) : BufferStream ↺`](docs/buffer-stream.md#BufferStream+breakup) - Breaks up a stream apart into chunks of the specified length
* [`bufferStream.stringify(encoding) : StringStream`](docs/buffer-stream.md#BufferStream+stringify) - Creates a string stream from the given buffer stream
* [`bufferStream.parse(parser) : DataStream`](docs/buffer-stream.md#BufferStream+parse) - Parses every buffer to object
* [`bufferStream.toStringStream(encoding) : StringStream`](docs/buffer-stream.md#BufferStream+toStringStream) - Creates a string stream from the given buffer stream
* [`bufferStream.pop(chars, func) : BufferStream ↺`](docs/buffer-stream.md#BufferStream+pop) - Shift given number of bytes from the original stream
* [`bufferStream.toDataStream(parser) : DataStream`](docs/buffer-stream.md#BufferStream+toDataStream) - Parses every buffer to object
* [`BufferStream:from()`](docs/buffer-stream.md#BufferStream.from) - Create BufferStream from anything.

### DataStream

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

[Detailed DataStream docs here](docs/data-stream.md)

**Most popular methods:**

* `new DataStream(opts)` - Create the DataStream.
* [`dataStream.map(func, Clazz) ↺`](docs/data-stream.md#DataStream+map) - Transforms stream objects into new ones, just like Array.prototype.map
* [`dataStream.filter(func) ↺`](docs/data-stream.md#DataStream+filter) - Filters object based on the function outcome, just like
* [`dataStream.reduce(func, into) ⇄`](docs/data-stream.md#DataStream+reduce) - Reduces the stream into a given accumulator
* [`dataStream.do(func) ↺`](docs/data-stream.md#DataStream+do) - Perform an asynchroneous operation without changing or resuming the stream.
* [`dataStream.into(func, into) ↺`](docs/data-stream.md#DataStream+into) - Allows own implementation of stream chaining.
* [`dataStream.use(func) ↺`](docs/data-stream.md#DataStream+use) - Calls the passed method in place with the stream as first argument, returns result.
* [`dataStream.run() ⇄`](docs/data-stream.md#DataStream+run) - Consumes all stream items doing nothing. Resolves when the stream is ended.
* [`dataStream.tap()`](docs/data-stream.md#DataStream+tap) - Stops merging transform callbacks at the current place in the command chain.
* [`dataStream.whenRead() ⇄`](docs/data-stream.md#DataStream+whenRead) - Reads a chunk from the stream and resolves the promise when read.
* [`dataStream.whenWrote(chunk, [...more]) ⇄`](docs/data-stream.md#DataStream+whenWrote) - Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.
* [`dataStream.whenEnd() ⇄`](docs/data-stream.md#DataStream+whenEnd) - Resolves when stream ends - rejects on uncaught error
* [`dataStream.whenDrained() ⇄`](docs/data-stream.md#DataStream+whenDrained) - Returns a promise that resolves when the stream is drained
* [`dataStream.whenError() ⇄`](docs/data-stream.md#DataStream+whenError) - Returns a promise that resolves (!) when the stream is errors
* [`dataStream.setOptions(options) ↺`](docs/data-stream.md#DataStream+setOptions) - Allows resetting stream options.
* [`dataStream.tee(func) ↺`](docs/data-stream.md#DataStream+tee) - Duplicate the stream
* [`dataStream.each(func) ↺`](docs/data-stream.md#DataStream+each) - Performs an operation on every chunk, without changing the stream
* [`dataStream.while(func) ↺`](docs/data-stream.md#DataStream+while) - Reads the stream while the function outcome is truthy.
* [`dataStream.until(func) ↺`](docs/data-stream.md#DataStream+until) - Reads the stream until the function outcome is truthy.
* [`dataStream.catch(callback) ↺`](docs/data-stream.md#DataStream+catch) - Provides a way to catch errors in chained streams.
* [`dataStream.raise(err) ⇄`](docs/data-stream.md#DataStream+raise) - Executes all error handlers and if none resolves, then emits an error.
* [`dataStream.pipe(to, options) : Writable ↺`](docs/data-stream.md#DataStream+pipe) - Override of node.js Readable pipe.
* [`dataStream.bufferify(serializer) : BufferStream ↺`](docs/data-stream.md#DataStream+bufferify) - Creates a BufferStream
* [`dataStream.stringify(serializer) : StringStream ↺`](docs/data-stream.md#DataStream+stringify) - Creates a StringStream
* [`dataStream.toArray(initial) : Array ⇄`](docs/data-stream.md#DataStream+toArray) - Aggregates the stream into a single Array
* [`dataStream.toGenerator() : Iterable.<Promise.<*>>`](docs/data-stream.md#DataStream+toGenerator) - Returns an async generator
* [`dataStream.toBufferStream(serializer) : BufferStream ↺`](docs/data-stream.md#DataStream+toBufferStream) - Creates a BufferStream
* [`dataStream.toStringStream(serializer) : StringStream ↺`](docs/data-stream.md#DataStream+toStringStream) - Creates a StringStream
* [`DataStream:from(str, options) ↺`](docs/data-stream.md#DataStream.from) - Returns a DataStream from pretty much anything sensibly possible.
* [`DataStream:fromArray(arr) : DataStream`](docs/data-stream.md#DataStream.fromArray) - Create a DataStream from an Array
* [`DataStream:fromIterator(iter) : DataStream`](docs/data-stream.md#DataStream.fromIterator) - Create a DataStream from an Iterator

### MultiStream

An object consisting of multiple streams than can be refined or muxed.

[Detailed MultiStream docs here](docs/multi-stream.md)

**Most popular methods:**

* `new MultiStream(streams, options)` - Crates an instance of MultiStream with the specified stream list
* [`multiStream.streams : Array`](docs/multi-stream.md#MultiStream+streams) - Array of all streams
* [`multiStream.length : number`](docs/multi-stream.md#MultiStream+length) - Returns the current stream length
* [`multiStream.map(aFunc) : MultiStream ↺`](docs/multi-stream.md#MultiStream+map) - Returns new MultiStream with the streams returned by the transform.
* [`multiStream.find(...args) : DataStream`](docs/multi-stream.md#MultiStream+find) - Calls Array.prototype.find on the streams
* [`multiStream.filter(func) : MultiStream ↺`](docs/multi-stream.md#MultiStream+filter) - Filters the stream list and returns a new MultiStream with only the
* [`multiStream.mux(cmp) : DataStream`](docs/multi-stream.md#MultiStream+mux) - Muxes the streams into a single one
* [`multiStream.add(stream)`](docs/multi-stream.md#MultiStream+add) - Adds a stream to the MultiStream
* [`multiStream.remove(stream)`](docs/multi-stream.md#MultiStream+remove) - Removes a stream from the MultiStream

### StringStream

A stream of string objects for further transformation on top of DataStream.

Example:

```javascript
StringStream.fromString()
```

[Detailed StringStream docs here](docs/string-stream.md)

**Most popular methods:**

* `new StringStream(encoding)` - Constructs the stream with the given encoding
* [`stringStream.shift(bytes, func) ↺`](docs/string-stream.md#StringStream+shift) - Shifts given length of chars from the original stream
* [`stringStream.split(splitter) ↺`](docs/string-stream.md#StringStream+split) - Splits the string stream by the specified regexp or string
* [`stringStream.match(matcher) ↺`](docs/string-stream.md#StringStream+match) - Finds matches in the string stream and streams the match results
* [`stringStream.toBufferStream() : BufferStream ↺`](docs/string-stream.md#StringStream+toBufferStream) - Transforms the StringStream to BufferStream
* [`stringStream.parse(parser) : DataStream ↺`](docs/string-stream.md#StringStream+parse) - Parses every string to object
* [`stringStream.pop(bytes, func) ↺`](docs/string-stream.md#StringStream+pop) - Shifts given length of chars from the original stream
* [`StringStream:SPLIT_LINE`](docs/string-stream.md#StringStream.SPLIT_LINE) - A handly split by line regex to quickly get a line-by-line stream
* [`StringStream:fromString(str, encoding) : StringStream`](docs/string-stream.md#StringStream.fromString) - Creates a StringStream and writes a specific string.
* [`StringStream:from()`](docs/string-stream.md#StringStream.from) - Create StringStream from anything.



## CLI

Check out the command line interface for simplified scramjet usage with [scramjet-cli](https://www.npmjs.com/package/scramjet-cli)

    $ sjr -i http://datasource.org/file.csv ./transform-module-1 ./transform-module-1 | gzip > logs.gz

## License and contributions

As of version 2.0 Scramjet is MIT Licensed.

## Help wanted

The project need's your help! There's lots of work to do - transforming and muxing, joining and splitting, browserifying, modularizing, documenting and issuing those issues.

If you want to help and be part of the Scramjet team, please reach out to me, signicode on Github or email me: scramjet@signicode.com.
