
This is the minimal, dependency free version of [`scramjet`](https://github.com/signicode/scramjet) used as of Scramjet
version 3.0.0 as a base for `scramjet` and scramjet plugins.

Unless you are sure, you should be better off with using the main repo and module.

It is built upon the logic behind three well known javascript array operations - namingly map, filter and reduce. This
means that if you've ever performed operations on an Array in JavaScript - you already know Scramjet like the back of
your hand.

## Usage

Scramjet uses functional programming to run transformations on your data streams in a fashion very similar to the well
known event-stream node module. Most transformations are done by passing a transform function. You can write your
function in three ways:

1. Synchronous

 Example: a simple stream transform that outputs a stream of objects of the same id property and the length of the value string.

 ```javascript
    datastream.map(
        (item) => ({id: item.id, length: item.value.length})
    )
 ```

2. Asynchronous using ES2015 async await

Example: A simple stream that uses Fetch API to get all the contents of all entries in the stream

```javascript
datastream.map(
    async (item) => fetch(item)
)
```

3. Asynchronous using Promises

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
