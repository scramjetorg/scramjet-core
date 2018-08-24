![Scramjet Logo](https://signicode.com/scramjet-logo-light.svg)

<a name="DataStream"></a>

## DataStream : stream.PassThrough
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

**Kind**: global class  
**Extends**: <code>stream.PassThrough</code>  

* [DataStream](#DataStream)  <code>stream.PassThrough</code>
    * [new DataStream(opts)](#new_DataStream_new)
    * [dataStream.map(func, Clazz)](#DataStream+map) ↺
    * [dataStream.filter(func)](#DataStream+filter) ↺
    * [dataStream.reduce(func, into)](#DataStream+reduce)
    * [dataStream.do(func)](#DataStream+do) ↺
    * [dataStream.into(func, into)](#DataStream+into) ↺
    * [dataStream.use(func)](#DataStream+use) ↺
    * [dataStream.run()](#DataStream+run)
    * [dataStream.tap()](#DataStream+tap)
    * [dataStream.whenRead()](#DataStream+whenRead)
    * [dataStream.whenWrote(chunk, [...more])](#DataStream+whenWrote)
    * [dataStream.whenEnd()](#DataStream+whenEnd)
    * [dataStream.whenDrained()](#DataStream+whenDrained)
    * [dataStream.whenError()](#DataStream+whenError)
    * [dataStream.setOptions(options)](#DataStream+setOptions) ↺
    * [dataStream.tee(func)](#DataStream+tee) ↺
    * [dataStream.each(func)](#DataStream+each) ↺
    * [dataStream.while(func)](#DataStream+while) ↺
    * [dataStream.until(func)](#DataStream+until) ↺
    * [dataStream.catch(callback)](#DataStream+catch) ↺
    * [dataStream.raise(err)](#DataStream+raise)
    * [dataStream.pipe(to, options)](#DataStream+pipe) ↺ <code>Writable</code>
    * [dataStream.bufferify(serializer)](#DataStream+bufferify) ↺ <code>BufferStream</code>
    * [dataStream.stringify(serializer)](#DataStream+stringify) ↺ <code>StringStream</code>
    * [dataStream.toArray(initial)](#DataStream+toArray) ⇄ <code>Array</code>
    * [dataStream.toGenerator()](#DataStream+toGenerator)  <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code>
    * [dataStream.toBufferStream(serializer)](#DataStream+toBufferStream) ↺ <code>BufferStream</code>
    * [dataStream.toStringStream(serializer)](#DataStream+toStringStream) ↺ <code>StringStream</code>
    * [DataStream:from(str, options)](#DataStream.from) ↺
    * [DataStream:fromArray(arr)](#DataStream.fromArray)  [<code>DataStream</code>](#DataStream)
    * [DataStream:fromIterator(iter)](#DataStream.fromIterator)  [<code>DataStream</code>](#DataStream)

<a name="new_DataStream_new"></a>

### new DataStream(opts)
Create the DataStream.


| Param | Type | Description |
| --- | --- | --- |
| opts | [<code>StreamOptions</code>](#StreamOptions) | Stream options passed to superclass |

<a name="DataStream+map"></a>

### dataStream.map(func, Clazz) ↺
Transforms stream objects into new ones, just like Array.prototype.map
does.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>MapCallback</code>](#MapCallback) | The function that creates the new object |
| Clazz | <code>Class</code> | (optional) The class to be mapped to. |

**Example**  
```js
[../samples/data-stream-map.js](../samples/data-stream-map.js)
```
<a name="DataStream+filter"></a>

### dataStream.filter(func) ↺
Filters object based on the function outcome, just like
Array.prototype.filter.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>FilterCallback</code>](#FilterCallback) | The function that filters the object |

**Example**  
```js
[../samples/data-stream-filter.js](../samples/data-stream-filter.js)
```
<a name="DataStream+reduce"></a>

### dataStream.reduce(func, into) ⇄
Reduces the stream into a given accumulator

Works similarly to Array.prototype.reduce, so whatever you return in the
former operation will be the first operand to the latter. The result is a
promise that's resolved with the return value of the last transform executed.

This method is serial - meaning that any processing on an entry will
occur only after the previous entry is fully processed. This does mean
it's much slower than parallel functions.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>ReduceCallback</code>](#ReduceCallback) | The into object will be passed as the  first argument, the data object from the stream as the second. |
| into | <code>Object</code> | Any object passed initially to the transform function |

**Example**  
```js
[../samples/data-stream-reduce.js](../samples/data-stream-reduce.js)
```
<a name="DataStream+do"></a>

### dataStream.do(func) ↺
Perform an asynchroneous operation without changing or resuming the stream.

In essence the stream will use the call to keep the backpressure, but the resolving value
has no impact on the streamed data (except for possile mutation of the chunk itself)

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>DoCallback</code>](#DoCallback) | the async function |

<a name="DataStream+into"></a>

### dataStream.into(func, into) ↺
Allows own implementation of stream chaining.

The async callback is called on every chunk and should implement writes in it's own way. The
resolution will be awaited for flow control. The passed `into` argument is passed as the first
argument to every call.

It returns the DataStream passed as the second argument.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>IntoCallback</code>](#IntoCallback) | the method that processes incoming chunks |
| into | [<code>DataStream</code>](#DataStream) | the DataStream derived class |

**Example**  
```js
[../samples/data-stream-into.js](../samples/data-stream-into.js)
```
<a name="DataStream+use"></a>

### dataStream.use(func) ↺
Calls the passed method in place with the stream as first argument, returns result.

The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
from the command line.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> \| <code>String</code> | if passed, the function will be called on self to add an option to inspect the stream in place, while not breaking the transform chain. Alternatively this can be a relative path to a scramjet-module. |
| [...args] | <code>\*</code> | any additional args top be passed to the module |

**Example**  
```js
[../samples/data-stream-use.js](../samples/data-stream-use.js)
```
<a name="DataStream+run"></a>

### dataStream.run() ⇄
Consumes all stream items doing nothing. Resolves when the stream is ended.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+tap"></a>

### dataStream.tap()
Stops merging transform callbacks at the current place in the command chain.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Example**  
```js
[../samples/data-stream-tap.js](../samples/data-stream-tap.js)
```
<a name="DataStream+whenRead"></a>

### dataStream.whenRead() ⇄
Reads a chunk from the stream and resolves the promise when read.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenWrote"></a>

### dataStream.whenWrote(chunk, [...more]) ⇄
Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | a chunk to write |
| [...more] | <code>\*</code> | more chunks to write |

<a name="DataStream+whenEnd"></a>

### dataStream.whenEnd() ⇄
Resolves when stream ends - rejects on uncaught error

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenDrained"></a>

### dataStream.whenDrained() ⇄
Returns a promise that resolves when the stream is drained

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenError"></a>

### dataStream.whenError() ⇄
Returns a promise that resolves (!) when the stream is errors

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+setOptions"></a>

### dataStream.setOptions(options) ↺
Allows resetting stream options.

It's much easier to use this in chain than constructing new stream:

```javascript
    stream.map(myMapper).filter(myFilter).setOptions({maxParallel: 2})
```

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Meta.conditions**: keep-order,chain  

| Param | Type |
| --- | --- |
| options | [<code>StreamOptions</code>](#StreamOptions) | 

<a name="DataStream+tee"></a>

### dataStream.tee(func) ↺
Duplicate the stream

Creates a duplicate stream instance and passes it to the callback.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>TeeCallback</code>](#TeeCallback) \| <code>Writable</code> | The duplicate stream will be passed as first argument. |

**Example**  
```js
[../samples/data-stream-tee.js](../samples/data-stream-tee.js)
```
<a name="DataStream+each"></a>

### dataStream.each(func) ↺
Performs an operation on every chunk, without changing the stream

This is a shorthand for ```stream.on("data", func)``` but with flow control.
Warning: this resumes the stream!

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>MapCallback</code>](#MapCallback) | a callback called for each chunk. |

<a name="DataStream+while"></a>

### dataStream.while(func) ↺
Reads the stream while the function outcome is truthy.

Stops reading and emits end as soon as it ends.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>FilterCallback</code>](#FilterCallback) | The condition check |

**Example**  
```js
[../samples/data-stream-while.js](../samples/data-stream-while.js)
```
<a name="DataStream+until"></a>

### dataStream.until(func) ↺
Reads the stream until the function outcome is truthy.

Works opposite of while.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>FilterCallback</code>](#FilterCallback) | The condition check |

**Example**  
```js
[../samples/data-stream-until.js](../samples/data-stream-until.js)
```
<a name="DataStream+catch"></a>

### dataStream.catch(callback) ↺
Provides a way to catch errors in chained streams.

The handler will be called as asynchronous
 - if it resolves then the error will be muted.
 - if it rejects then the error will be passed to the next handler

If no handlers will resolve the error, an `error` event will be emitted

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Error handler (async function) |

**Example**  
```js
[../samples/data-stream-catch.js](../samples/data-stream-catch.js)
```
<a name="DataStream+raise"></a>

### dataStream.raise(err) ⇄
Executes all error handlers and if none resolves, then emits an error.

The returned promise will always be resolved even if there are no successful handlers.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | The thrown error |

**Example**  
```js
[../samples/data-stream-raise.js](../samples/data-stream-raise.js)
```
<a name="DataStream+pipe"></a>

### dataStream.pipe(to, options) : Writable ↺
Override of node.js Readable pipe.

Except for calling overridden method it proxies errors to piped stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>Writable</code> - the `to` stream  

| Param | Type | Description |
| --- | --- | --- |
| to | <code>Writable</code> | Writable stream to write to |
| options | <code>WritableOptions</code> |  |

<a name="DataStream+bufferify"></a>

### dataStream.bufferify(serializer) : BufferStream ↺
Creates a BufferStream

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>BufferStream</code> - the resulting stream  
**Meta.noreadme**:   

| Param | Type | Description |
| --- | --- | --- |
| serializer | [<code>MapCallback</code>](#MapCallback) | A method that converts chunks to buffers |

**Example**  
```js
[../samples/data-stream-tobufferstream.js](../samples/data-stream-tobufferstream.js)
```
<a name="DataStream+stringify"></a>

### dataStream.stringify(serializer) : StringStream ↺
Creates a StringStream

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>StringStream</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| serializer | [<code>MapCallback</code>](#MapCallback) | A method that converts chunks to strings |

**Example**  
```js
[../samples/data-stream-tostringstream.js](../samples/data-stream-tostringstream.js)
```
<a name="DataStream+toArray"></a>

### dataStream.toArray(initial) : Array ⇄
Aggregates the stream into a single Array

In fact it's just a shorthand for reducing the stream into an Array.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| initial | <code>Array</code> | Optional array to begin with. |

<a name="DataStream+toGenerator"></a>

### dataStream.toGenerator() : Iterable.<Promise.<*>>
Returns an async generator

Ready for https://github.com/tc39/proposal-async-iteration

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code> - Returns an iterator that returns a promise for each item.  
<a name="DataStream+toBufferStream"></a>

### dataStream.toBufferStream(serializer) : BufferStream ↺
Creates a BufferStream

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>BufferStream</code> - the resulting stream  
**Meta.noreadme**:   

| Param | Type | Description |
| --- | --- | --- |
| serializer | [<code>MapCallback</code>](#MapCallback) | A method that converts chunks to buffers |

**Example**  
```js
[../samples/data-stream-tobufferstream.js](../samples/data-stream-tobufferstream.js)
```
<a name="DataStream+toStringStream"></a>

### dataStream.toStringStream(serializer) : StringStream ↺
Creates a StringStream

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  
**Returns**: <code>StringStream</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| serializer | [<code>MapCallback</code>](#MapCallback) | A method that converts chunks to strings |

**Example**  
```js
[../samples/data-stream-tostringstream.js](../samples/data-stream-tostringstream.js)
```
<a name="DataStream.from"></a>

### DataStream:from(str, options) ↺
Returns a DataStream from pretty much anything sensibly possible.

Depending on type:
* `self` will return self immediately
* `Readable` stream will get piped to the current stream with errors forwarded
* `Array` will get iterated and all items will be pushed to the returned stream.
  The stream will also be ended in such case.
* `GeneratorFunction` will get executed to return the iterator which will be used as source for items
* `AsyncGeneratorFunction` will also work as above (including generators) in node v10.
* `Iterable`s iterator will be used as a source for streams

You can also pass a `Function` or `AsyncFunction` that will result in anything passed to `from`
subsequently. You can use your stream immediately though.

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>Array</code> \| <code>Iterable</code> \| <code>AsyncGeneratorFunction</code> \| <code>GeneratorFunction</code> \| <code>AsyncFunction</code> \| <code>function</code> \| <code>Readable</code> | argument to be turned into new stream |
| options | [<code>StreamOptions</code>](#StreamOptions) \| <code>Writable</code> |  |

<a name="DataStream.fromArray"></a>

### DataStream:fromArray(arr) : DataStream
Create a DataStream from an Array

**Kind**: static method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | list of chunks |

**Example**  
```js
[../samples/data-stream-fromarray.js](../samples/data-stream-fromarray.js)
```
<a name="DataStream.fromIterator"></a>

### DataStream:fromIterator(iter) : DataStream
Create a DataStream from an Iterator

Doesn't end the stream until it reaches end of the iterator.

**Kind**: static method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| iter | <code>Iterator</code> | the iterator object |

**Example**  
```js
[../samples/data-stream-fromiterator.js](../samples/data-stream-fromiterator.js)
```
<a name="MapCallback"></a>

## MapCallback : Promise | *
**Kind**: global typedef  
**Returns**: <code>Promise</code> \| <code>\*</code> - the mapped object  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be mapped |

<a name="FilterCallback"></a>

## FilterCallback : Promise | Boolean
**Kind**: global typedef  
**Returns**: <code>Promise</code> \| <code>Boolean</code> - information if the object should remain in
                            the filtered stream.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be filtered or not |

<a name="ReduceCallback"></a>

## ReduceCallback : Promise | *
**Kind**: global typedef  
**Returns**: <code>Promise</code> \| <code>\*</code> - accumulator for the next pass  

| Param | Type | Description |
| --- | --- | --- |
| acc | <code>\*</code> | the accumulator - the object initially passed or returned                by the previous reduce operation |
| chunk | <code>Object</code> | the stream chunk. |

<a name="DoCallback"></a>

## DoCallback : function ⇄
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>Object</code> | source stream chunk |

<a name="IntoCallback"></a>

## IntoCallback : * ⇄
**Kind**: global typedef  
**Returns**: <code>\*</code> - resolution for the old stream (for flow control only)  

| Param | Type | Description |
| --- | --- | --- |
| into | <code>\*</code> | stream passed to the into method |
| chunk | <code>Object</code> | source stream chunk |

<a name="TeeCallback"></a>

## TeeCallback : function
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| teed | [<code>DataStream</code>](#DataStream) | The teed stream |

<a name="StreamOptions"></a>

## StreamOptions : Object
Standard options for scramjet streams.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| maxParallel | <code>Number</code> | the number of transforms done in parallel |
| referrer | [<code>DataStream</code>](#DataStream) | a referring stream to point to (if possible the transforms will be pushed to it                                 instead of creating a new stream) |

