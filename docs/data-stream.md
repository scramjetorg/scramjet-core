## Classes

<dl>
<dt><a href="#DataStream">DataStream</a> ⇐ <code>stream.PassThrough</code></dt>
<dd><p>DataStream is the primary stream type for Scramjet. When you parse your
stream, just pipe it you can then perform calculations on the data objects
streamed through your flow.</p>
<pre><code class="lang-javascript"> await (DataStream.fromArray([1,2,3,4,5]) // create a DataStream
     .map(readFile)                       // read some data asynchronously
     .map(sendToApi)                      // send the data somewhere
     .whenEnd());                         // wait until end
</code></pre>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#toStringStream">toStringStream()</a></dt>
<dd><p>Alias for <a href="#DataStream+stringify">stringify</a></p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#MapCallback">MapCallback</a> ⇒ <code>Promise</code> | <code>*</code></dt>
<dd></dd>
<dt><a href="#FilterCallback">FilterCallback</a> ⇒ <code>Promise</code> | <code>Boolean</code></dt>
<dd></dd>
<dt><a href="#ReduceCallback">ReduceCallback</a> ⇒ <code>Promise</code> | <code>*</code></dt>
<dd></dd>
<dt><a href="#IntoCallback">IntoCallback</a> ⇒ <code>*</code></dt>
<dd></dd>
<dt><a href="#TeeCallback">TeeCallback</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#StreamOptions">StreamOptions</a> : <code>Object</code></dt>
<dd><p>Standard options for scramjet streams.</p>
</dd>
</dl>

<a name="DataStream"></a>

## DataStream ⇐ <code>stream.PassThrough</code>
DataStream is the primary stream type for Scramjet. When you parse your
stream, just pipe it you can then perform calculations on the data objects
streamed through your flow.

```javascript
 await (DataStream.fromArray([1,2,3,4,5]) // create a DataStream
     .map(readFile)                       // read some data asynchronously
     .map(sendToApi)                      // send the data somewhere
     .whenEnd());                         // wait until end
```

**Kind**: global class  
**Extends**: <code>stream.PassThrough</code>  

* [DataStream](#DataStream) ⇐ <code>stream.PassThrough</code>
    * [new DataStream(opts)](#new_DataStream_new)
    * _instance_
        * [.map(func, Clazz)](#DataStream+map) ⇒ [<code>DataStream</code>](#DataStream)
        * [.filter(func)](#DataStream+filter) ⇒ [<code>DataStream</code>](#DataStream)
        * [.reduce(func, into)](#DataStream+reduce) ⇒ <code>Promise</code>
        * [.into(func, into)](#DataStream+into) ⇒ [<code>DataStream</code>](#DataStream)
        * [.use(func)](#DataStream+use) ⇒ <code>\*</code>
        * [.tee(func)](#DataStream+tee) ⇒ [<code>DataStream</code>](#DataStream)
        * [.each(func)](#DataStream+each) ↩︎
        * [.while(func)](#DataStream+while) ⇒ [<code>DataStream</code>](#DataStream)
        * [.until(func)](#DataStream+until) ⇒ [<code>DataStream</code>](#DataStream)
        * [.catch(callback)](#DataStream+catch) ↩︎
        * [.raise(err)](#DataStream+raise) ⇒ <code>Promise</code>
        * [.pipe(to, options)](#DataStream+pipe) ⇒ <code>Writable</code>
        * [.bufferify(serializer)](#DataStream+bufferify) ⇒ <code>BufferStream</code>
        * [.stringify(serializer)](#DataStream+stringify) ⇒ <code>StringStream</code>
        * [.run()](#DataStream+run) ⇒ <code>Promise</code>
        * [.toArray(initial)](#DataStream+toArray) ⇒ <code>Promise</code>
        * [.toGenerator()](#DataStream+toGenerator) ⇒ <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code>
        * [.tap()](#DataStream+tap)
        * [.whenRead()](#DataStream+whenRead) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.whenWrote(...data)](#DataStream+whenWrote) ⇒ <code>Promise</code>
        * [.whenEnd()](#DataStream+whenEnd) ⇒ <code>Promise</code>
        * [.whenDrained()](#DataStream+whenDrained) ⇒ <code>Promise</code>
        * [.whenError()](#DataStream+whenError) ⇒ <code>Promise</code>
        * [.setOptions(options)](#DataStream+setOptions) ↩︎
    * _static_
        * [.fromArray(arr)](#DataStream.fromArray) ⇒ [<code>DataStream</code>](#DataStream)
        * [.fromIterator(iter)](#DataStream.fromIterator) ⇒ [<code>DataStream</code>](#DataStream)

<a name="new_DataStream_new"></a>

### new DataStream(opts)
Create the DataStream.


| Param | Type | Description |
| --- | --- | --- |
| opts | [<code>StreamOptions</code>](#StreamOptions) | Stream options passed to superclass |

<a name="DataStream+map"></a>

### dataStream.map(func, Clazz) ⇒ [<code>DataStream</code>](#DataStream)
Transforms stream objects into new ones, just like Array.prototype.map
does.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - mapped stream  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>MapCallback</code>](#MapCallback) | The function that creates the new object |
| Clazz | <code>Class</code> | (optional) The class to be mapped to. |

**Example**  
```js
[../samples/data-stream-map.js](../samples/data-stream-map.js)
```
<a name="DataStream+filter"></a>

### dataStream.filter(func) ⇒ [<code>DataStream</code>](#DataStream)
Filters object based on the function outcome, just like
Array.prototype.filter.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - filtered stream  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>FilterCallback</code>](#FilterCallback) | The function that filters the object |

**Example**  
```js
[../samples/data-stream-filter.js](../samples/data-stream-filter.js)
```
<a name="DataStream+reduce"></a>

### dataStream.reduce(func, into) ⇒ <code>Promise</code>
Reduces the stream into a given accumulator

Works similarily to Array.prototype.reduce, so whatever you return in the
former operation will be the first operand to the latter.

This method is serial - meaning that any processing on an entry will
occur only after the previous entry is fully processed. This does mean
it's much slower than parallel functions.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> - Promise resolved by the last object returned by the call of the transform function  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>TransformFunction</code> | The into object will be passed as the  first argument, the data object from the stream as the second. |
| into | <code>Object</code> | Any object passed initally to the transform function |

**Example**  
```js
[../samples/data-stream-reduce.js](../samples/data-stream-reduce.js)
```
<a name="DataStream+into"></a>

### dataStream.into(func, into) ⇒ [<code>DataStream</code>](#DataStream)
Pushes the data into another scramjet stream while keeping flow control and

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - the object passed as `into`  

| Param | Type | Description |
| --- | --- | --- |
| func |  | [description] |
| into | [<code>DataStream</code>](#DataStream) | [description] |

<a name="DataStream+use"></a>

### dataStream.use(func) ⇒ <code>\*</code>
Calls the passed method in place with the stream as first argument, returns result.

The main intention of this method is to run scramjet modules - transforms that allow complex transforms of
streams. These modules can also be run with [scramjet-cli](https://github.com/signicode/scramjet-cli) directly
from the command line.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>\*</code> - anything the passed function returns  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> \| <code>String</code> | if passed, the function will be called on self                         to add an option to inspect the stream in place,                         while not breaking the transform chain.                         Alternatively this can be a relative path to a scramjet-module. |

**Example**  
```js
[../samples/data-stream-use.js](../samples/data-stream-use.js)
```
<a name="DataStream+tee"></a>

### dataStream.tee(func) ⇒ [<code>DataStream</code>](#DataStream)
Duplicate the stream

Creates a duplicate stream instance and passes it to the callback.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - self  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>TeeCallback</code>](#TeeCallback) | The duplicate stream will be passed as first argument. |

**Example**  
```js
[../samples/data-stream-tee.js](../samples/data-stream-tee.js)
```
<a name="DataStream+each"></a>

### dataStream.each(func) ↩︎
Performs an operation on every chunk, without changing the stream

This is a shorthand for ```stream.on("data", func)``` but with flow control.
Warning: this resumes the stream!

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>MapCallback</code>](#MapCallback) | a callback called for each chunk. |

<a name="DataStream+while"></a>

### dataStream.while(func) ⇒ [<code>DataStream</code>](#DataStream)
Reads the stream while the function outcome is truthy.

Stops reading and emits end as soon as it ends.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - the shortened stream  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>FilterCallback</code>](#FilterCallback) | The condition check |

<a name="DataStream+until"></a>

### dataStream.until(func) ⇒ [<code>DataStream</code>](#DataStream)
Reads the stream until the function outcome is truthy.

Works opposite of while.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - the shortened stream  

| Param | Type | Description |
| --- | --- | --- |
| func | [<code>FilterCallback</code>](#FilterCallback) | The condition check |

<a name="DataStream+catch"></a>

### dataStream.catch(callback) ↩︎
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

<a name="DataStream+raise"></a>

### dataStream.raise(err) ⇒ <code>Promise</code>
Executes all error handlers and if none resolves, then emits an error.

The returned promise will always be resolved even if there are no successful handlers.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> - the promise that will be resolved when the error is handled.  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | The thrown error |

<a name="DataStream+pipe"></a>

### dataStream.pipe(to, options) ⇒ <code>Writable</code>
Override of node.js Readable pipe.

Except for calling overridden method it proxies errors to piped stream.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Writable</code> - the `to` stream  

| Param | Type | Description |
| --- | --- | --- |
| to | <code>Writable</code> | Writable stream to write to |
| options | <code>WritableOptions</code> |  |

<a name="DataStream+bufferify"></a>

### dataStream.bufferify(serializer) ⇒ <code>BufferStream</code>
Creates a BufferStream

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>BufferStream</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| serializer | [<code>MapCallback</code>](#MapCallback) | A method that converts chunks to buffers |

**Example**  
```js
[../samples/data-stream-tobufferstream.js](../samples/data-stream-tobufferstream.js)
```
<a name="DataStream+stringify"></a>

### dataStream.stringify(serializer) ⇒ <code>StringStream</code>
Creates a StringStream

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>StringStream</code> - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| serializer | [<code>MapCallback</code>](#MapCallback) | A method that converts chunks to strings |

**Example**  
```js
[../samples/data-stream-tostringstream.js](../samples/data-stream-tostringstream.js)
```
<a name="DataStream+run"></a>

### dataStream.run() ⇒ <code>Promise</code>
Consumes all stream items without doing anything

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> - Resolved when the whole stream is read  
<a name="DataStream+toArray"></a>

### dataStream.toArray(initial) ⇒ <code>Promise</code>
Aggregates the stream into a single Array

In fact it's just a shorthand for reducing the stream into an Array.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise</code> - Promise resolved with the resulting array on stream end.  

| Param | Type | Description |
| --- | --- | --- |
| initial | <code>Array</code> | Optional array to begin with. |

<a name="DataStream+toGenerator"></a>

### dataStream.toGenerator() ⇒ <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code>
Returns an async generator

Ready for https://github.com/tc39/proposal-async-iteration

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Iterable.&lt;Promise.&lt;\*&gt;&gt;</code> - Returns an iterator that returns a promise for each item.  
<a name="DataStream+tap"></a>

### dataStream.tap()
Stops merging transform callbacks at the current place in the command chain.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Example**  
```js
[../samples/data-stream-tap.js](../samples/data-stream-tap.js)
```
<a name="DataStream+whenRead"></a>

### dataStream.whenRead() ⇒ <code>Promise.&lt;Object&gt;</code>
Reads a chunk from the stream and resolves the promise when read.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - the read item  
<a name="DataStream+whenWrote"></a>

### dataStream.whenWrote(...data) ⇒ <code>Promise</code>
Writes a chunk to the stream and returns a Promise resolved when more chunks can be written.

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  

| Param | Type | Description |
| --- | --- | --- |
| ...data | <code>\*</code> | Chunk(s) to be written before resolving. |

<a name="DataStream+whenEnd"></a>

### dataStream.whenEnd() ⇒ <code>Promise</code>
Resolves when stream ends - rejects on uncaught error

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenDrained"></a>

### dataStream.whenDrained() ⇒ <code>Promise</code>
Returns a promise that resolves when the stream is drained

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+whenError"></a>

### dataStream.whenError() ⇒ <code>Promise</code>
Returns a promise that resolves (!) when the stream is errors

**Kind**: instance method of [<code>DataStream</code>](#DataStream)  
<a name="DataStream+setOptions"></a>

### dataStream.setOptions(options) ↩︎
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

<a name="DataStream.fromArray"></a>

### DataStream.fromArray(arr) ⇒ [<code>DataStream</code>](#DataStream)
Create a DataStream from an Array

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | list of chunks |

**Example**  
```js
[../samples/data-stream-fromarray.js](../samples/data-stream-fromarray.js)
```
<a name="DataStream.fromIterator"></a>

### DataStream.fromIterator(iter) ⇒ [<code>DataStream</code>](#DataStream)
Create a DataStream from an Iterator

Doesn't end the stream until it reaches end of the iterator.

**Kind**: static method of [<code>DataStream</code>](#DataStream)  
**Returns**: [<code>DataStream</code>](#DataStream) - the resulting stream  

| Param | Type | Description |
| --- | --- | --- |
| iter | <code>Iterator</code> | the iterator object |

**Example**  
```js
[../samples/data-stream-fromiterator.js](../samples/data-stream-fromiterator.js)
```
<a name="toStringStream"></a>

## toStringStream()
Alias for [stringify](#DataStream+stringify)

**Kind**: global function  
<a name="MapCallback"></a>

## MapCallback ⇒ <code>Promise</code> \| <code>\*</code>
**Kind**: global typedef  
**Returns**: <code>Promise</code> \| <code>\*</code> - the mapped object  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be mapped |

<a name="FilterCallback"></a>

## FilterCallback ⇒ <code>Promise</code> \| <code>Boolean</code>
**Kind**: global typedef  
**Returns**: <code>Promise</code> \| <code>Boolean</code> - information if the object should remain in
                            the filtered stream.  

| Param | Type | Description |
| --- | --- | --- |
| chunk | <code>\*</code> | the chunk to be filtered or not |

<a name="ReduceCallback"></a>

## ReduceCallback ⇒ <code>Promise</code> \| <code>\*</code>
**Kind**: global typedef  
**Returns**: <code>Promise</code> \| <code>\*</code> - accumulator for the next pass  

| Param | Type | Description |
| --- | --- | --- |
| acc | <code>\*</code> | the accumulator - the object initially passed or retuned                by the previous reduce operation |
| chunk | <code>Object</code> | the stream chunk. |

<a name="IntoCallback"></a>

## IntoCallback ⇒ <code>\*</code>
**Kind**: global typedef  
**Returns**: <code>\*</code> - resolution for the old stream (for flow control only)  

| Param | Type | Description |
| --- | --- | --- |
| into | <code>\*</code> | stream passed to the into method |
| chunk | <code>Object</code> | source stream chunk |

<a name="TeeCallback"></a>

## TeeCallback : <code>function</code>
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| teed | [<code>DataStream</code>](#DataStream) | The teed stream |

<a name="StreamOptions"></a>

## StreamOptions : <code>Object</code>
Standard options for scramjet streams.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| maxParallel | <code>Number</code> | the number of transforms done in parallel |
| referrer | [<code>DataStream</code>](#DataStream) | a referring stream to point to (if possible the transforms will be pushed to it                                 instead of creating a new stream) |

