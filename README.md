# minipass

A _very_ minimal implementation of a [PassThrough
stream](https://nodejs.org/api/stream.html#stream_class_stream_passthrough)

[It's very
fast](https://docs.google.com/spreadsheets/d/1oObKSrVwLX_7Ut4Z6g3fZW-AX1j1-k6w-cDsrkaSbHM/edit#gid=0)
for objects, strings, and buffers.

Supports pipe()ing (including multi-pipe() and backpressure
transmission), buffering data until either a `data` event handler or
`pipe()` is added (so you don't lose the first chunk), and most other
cases where PassThrough is a good idea.

There is a `read()` method, but it's much more efficient to consume
data from this stream via `'data'` events or by calling `pipe()` into
some other stream.  Calling `read()` requires the buffer to be
flattened in some cases, which requires copying memory.

There is also no `unpipe()` method.  Once you start piping, there is
no stopping it!

If you set `objectMode: true` in the options, then whatever is written
will be emitted.  Otherwise, it'll do a minimal amount of Buffer
copying to ensure proper Streams semantics when `read(n)` is called.

`objectMode` can also be set by doing `stream.objectMode = true`, or by
writing any non-string/non-buffer data.  `objectMode` cannot be set to
false once it is set.

This is not a `through` or `through2` stream.  It doesn't transform
the data, it just passes it right through.  If you want to transform
the data, extend the class, and override the `write()` method.  Once
you're done transforming the data however you want, call
`super.write()` with the transform output.

For some examples of streams that extend Minipass in various ways, check
out:

- [minizlib](http://npm.im/minizlib)
- [fs-minipass](http://npm.im/fs-minipass)
- [tar](http://npm.im/tar)
- [minipass-collect](http://npm.im/minipass-collect)
- [minipass-flush](http://npm.im/minipass-flush)
- [minipass-pipeline](http://npm.im/minipass-pipeline)
- [tap](http://npm.im/tap)
- [tap-parser](http://npm.im/tap)
- [treport](http://npm.im/tap)

## Differences from Node.js Streams

There are several things that make Minipass streams different from (and in
some ways superior to) Node.js core streams.

### Timing

Minipass streams are designed to support synchronous use-cases.  Thus, data
is emitted as soon as it is available, always.  It is buffered until read,
but no longer.  Another way to look at it is that Minipass streams are
exactly as synchronous as the logic that writes into them.

This can be surprising if your code relies on `PassThrough.write()` always
providing data on the next tick rather than the current one, or being able
to call `resume()` and not have the entire buffer disappear immediately.

However, without this synchronicity guarantee, there would be no way for
Minipass to achieve the speeds it does, or support the synchronous use
cases that it does.  Simply put, waiting takes time.

This non-deferring approach makes Minipass streams much easier to reason
about, especially in the context of Promises and other flow-control
mechanisms.

### No High/Low Water Marks

Node.js core streams will optimistically fill up a buffer, returning `true`
on all writes until the limit is hit, even if the data has nowhere to go.
Then, they will not attempt to draw more data in until the buffer size dips
below a minimum value.

Minipass streams are much simpler.  The `write()` method will return `true`
if the data has somewhere to go (which is to say, given the timing
guarantees, that the data is already there by the time `write()` returns).

If the data has nowhere to go, then `write()` returns false, and the data
sits in a buffer, to be drained out immediately as soon as anyone consumes
it.

### Emit `end` When Asked

If you do `stream.on('end', someFunction)`, and the stream has already
emitted `end`, then it will emit it again.

To prevent calling handlers multiple times who would not expect multiple
ends to occur, all listeners are removed from the `'end'` event whenever it
is emitted.

## USAGE

```js
const Minipass = require('minipass')
const mp = new Minipass(options) // optional: { encoding, objectMode }
mp.write('foo')
mp.pipe(someOtherStream)
mp.end('bar')
```

### OPTIONS

* `encoding` How would you like the data coming _out_ of the stream to be
  encoded?  Accepts any values that can be passed to `Buffer.toString()`.
* `objectMode` Emit data exactly as it comes in.  This will be flipped on
  by default if you write() something other than a string or Buffer at any
  point.  Setting `objectMode: true` will prevent setting any encoding
  value.

### API

Implements the user-facing portions of Node.js's `Readable` and `Writable`
streams.

### Methods

* `write(chunk, [encoding], [callback])` - Put data in.  (Note that, in the
  base Minipass class, the same data will come out.)  Returns `false` if
  the stream will buffer the next write, or true if it's still in
  "flowing" mode.
* `end([chunk, [encoding]], [callback])` - Signal that you have no more
  data to write.  This will queue an `end` event to be fired when all the
  data has been consumed.
* `setEncoding(encoding)` - Set the encoding for data coming of the
  stream.  This can only be done once.
* `pause()` - No more data for a while, please.  This also prevents `end`
  from being emitted for empty streams until the stream is resumed.
* `resume()` - Resume the stream.  If there's data in the buffer, it is
  all discarded.  Any buffered events are immediately emitted.
* `pipe(dest)` - Send all output to the stream provided.  There is no way
  to unpipe.  When data is emitted, it is immediately written to any and
  all pipe destinations.
* `on(ev, fn)`, `emit(ev, fn)` - Minipass streams are EventEmitters.
  Some events are given special treatment, however.  (See below under
  "events".)
* `promise()` - Returns a Promise that resolves when the stream emits
  `end`, or rejects if the stream emits `error`.
* `collect()` - Return a Promise that resolves on `end` with an array
  containing each chunk of data that was emitted, or rejects if the
  stream emits `error`.  Note that this consumes the stream data.
* `concat()` - Same as `collect()`, but concatenates the data into a
  single Buffer object.  Will reject the returned promise if the stream is
  in objectMode, or if it goes into objectMode by the end of the data.
* `read(n)` - Consume `n` bytes of data out of the buffer.  If `n` is not
  provided, then consume all of it.  If `n` bytes are not available, then
  it returns null.  **Note** consuming streams in this way is less
  efficient, and can lead to unnecessary Buffer copying.
* `destroy([er])` - Destroy the stream.  If an error is provided, then an
  `'error'` event is emitted.  If the stream has a `close()` method, and
  has not emitted a `'close'` event yet, then `stream.close()` will be
  called.  Any Promises returned by `.promise()`, `.collect()` or
  `.concat()` will be rejected.  After being destroyed, writing to the
  stream will emit an error.  No more data will be emitted if the stream is
  destroyed, even if it was previously buffered.

### Properties

* `bufferLength` Read-only.  Total number of bytes buffered, or in the case
  of objectMode, the total number of objects.
* `encoding` The encoding that has been set.  (Setting this is equivalent
  to calling `setEncoding(enc)` and has the same prohibition against
  setting multiple times.)
* `flowing` Read-only.  Boolean indicating whether a chunk written to the
  stream will be immediately emitted.
* `emittedEnd` Read-only.  Boolean indicating whether the end-ish events
  (ie, `end`, `prefinish`, `finish`) have been emitted.  Note that
  listening on any end-ish event will immediateyl re-emit it if it has
  already been emitted.
* `writable` Whether the stream is writable.  Default `true`.  Set to
  `false` when `end()`
* `readable` Whether the stream is readable.  Default `true`.
* `buffer` A [yallist](http://npm.im/yallist) linked list of chunks written
  to the stream that have not yet been emitted.  (It's probably a bad idea
  to mess with this.)
* `pipes` A [yallist](http://npm.im/yallist) linked list of streams that
  this stream is piping into.  (It's probably a bad idea to mess with
  this.)
* `destroyed` A getter that indicates whether the stream was destroyed.
* `paused` True if the stream has been explicitly paused, otherwise false.
* `objectMode` Indicates whether the stream is in `objectMode`.  Once set
  to `true`, it cannot be set to `false`.

### Events

* `data` Emitted when there's data to read.  Argument is the data to read.
  This is never emitted while not flowing.  If a listener is attached, that
  will resume the stream.
* `end` Emitted when there's no more data to read.  This will be emitted
  immediately for empty streams when `end()` is called.  If a listener is
  attached, and `end` was already emitted, then it will be emitted again.
  All listeners are removed when `end` is emitted.
* `prefinish` An end-ish event that follows the same logic as `end` and is
  emitted in the same conditions where `end` is emitted.  Emitted after
  `'end'`.
* `finish` An end-ish event that follows the same logic as `end` and is
  emitted in the same conditions where `end` is emitted.  Emitted after
  `'prefinish'`.
* `close` An indication that an underlying resource has been released.
  Minipass does not emit this event, but will defer it until after `end`
  has been emitted, since it throws off some stream libraries otherwise.
* `drain` Emitted when the internal buffer empties, and it is again
  suitable to `write()` into the stream.
* `readable` Emitted when data is buffered and ready to be read by a
  consumer.
* `resume` Emitted when stream changes state from buffering to flowing
  mode.  (Ie, when `resume` is called, `pipe` is called, or a `data` event
  listener is added.)

### Static Methods

* `Minipass.isStream(stream)` Returns `true` if the argument is a stream,
  and false otherwise.  To be considered a stream, the object must be
  either an instance of Minipass, or an EventEmitter that has either a
  `pipe()` method, or both `write()` and `end()` methods.  (Pretty much any
  stream in node-land will return `true` for this.)

## EXAMPLES

Here are some examples of things you can do with Minipass streams.

### simple "are you done yet" promise

```js
mp.promise().then(() => {
  // stream is finished
}, er => {
  // stream emitted an error
})
```

### collecting

```js
mp.collect().then(all => {
  // all is an array of all the data emitted
  // encoding is supported in this case, so
  // so the result will be a collection of strings if
  // an encoding is specified, or buffers/objects if not.
  //
  // In an async function, you may do
  // const data = await stream.collect()
})
```

### collecting into a single blob

This is a bit slower because it concatenates the data into one chunk for
you, but if you're going to do it yourself anyway, it's convenient this
way:

```js
mp.concat().then(onebigchunk => {
  // onebigchunk is a string if the stream
  // had an encoding set, or a buffer otherwise.
})
```

### iteration

You can iterate over streams synchronously or asynchronously in
platforms that support it.

Synchronous iteration will end when the currently available data is
consumed, even if the `end` event has not been reached.  In string and
buffer mode, the data is concatenated, so unless multiple writes are
occurring in the same tick as the `read()`, sync iteration loops will
generally only have a single iteration.

To consume chunks in this way exactly as they have been written, with
no flattening, create the stream with the `{ objectMode: true }`
option.

```js
const mp = new Minipass({ objectMode: true })
mp.write('a')
mp.write('b')
for (let letter of mp) {
  console.log(letter) // a, b
}
mp.write('c')
mp.write('d')
for (let letter of mp) {
  console.log(letter) // c, d
}
mp.write('e')
mp.end()
for (let letter of mp) {
  console.log(letter) // e
}
for (let letter of mp) {
  console.log(letter) // nothing
}
```

Asynchronous iteration will continue until the end event is reached,
consuming all of the data.

```js
const mp = new Minipass({ encoding: 'utf8' })

// some source of some data
let i = 5
const inter = setInterval(() => {
  if (i --> 0)
    mp.write(Buffer.from('foo\n', 'utf8'))
  else {
    mp.end()
    clearInterval(inter)
  }
}, 100)

// consume the data with asynchronous iteration
async function consume () {
  for await (let chunk of mp) {
    console.log(chunk)
  }
  return 'ok'
}

consume().then(res => console.log(res))
// logs `foo\n` 5 times, and then `ok`
```

### subclass that `console.log()`s everything written into it

```js
class Logger extends Minipass {
  write (chunk, encoding, callback) {
    console.log('WRITE', chunk, encoding)
    return super.write(chunk, encoding, callback)
  }
  end (chunk, encoding, callback) {
    console.log('END', chunk, encoding)
    return super.end(chunk, encoding, callback)
  }
}

someSource.pipe(new Logger()).pipe(someDest)
```

### same thing, but using an inline anonymous class

```js
// js classes are fun
someSource
  .pipe(new (class extends Minipass {
    emit (ev, ...data) {
      // let's also log events, because debugging some weird thing
      console.log('EMIT', ev)
      return super.emit(ev, ...data)
    }
    write (chunk, encoding, callback) {
      console.log('WRITE', chunk, encoding)
      return super.write(chunk, encoding, callback)
    }
    end (chunk, encoding, callback) {
      console.log('END', chunk, encoding)
      return super.end(chunk, encoding, callback)
    }
  }))
  .pipe(someDest)
```

### subclass that defers 'end' for some reason

```js
class SlowEnd extends Minipass {
  emit (ev, ...args) {
    if (ev === 'end') {
      console.log('going to end, hold on a sec')
      setTimeout(() => {
        console.log('ok, ready to end now')
        super.emit('end', ...args)
      }, 100)
    } else {
      return super.emit(ev, ...args)
    }
  }
}
```

### transform that creates newline-delimited JSON

```js
class NDJSONEncode extends Minipass {
  write (obj, cb) {
    try {
      // JSON.stringify can throw, emit an error on that
      return super.write(JSON.stringify(obj) + '\n', 'utf8', cb)
    } catch (er) {
      this.emit('error', er)
    }
  }
  end (obj, cb) {
    if (typeof obj === 'function') {
      cb = obj
      obj = undefined
    }
    if (obj !== undefined) {
      this.write(obj)
    }
    return super.end(cb)
  }
}
```

### transform that parses newline-delimited JSON

```js
class NDJSONDecode extends Minipass {
  constructor (options) {
    // always be in object mode, as far as Minipass is concerned
    super({ objectMode: true })
    this._jsonBuffer = ''
  }
  write (chunk, encoding, cb) {
    if (typeof chunk === 'string' &&
        typeof encoding === 'string' &&
        encoding !== 'utf8') {
      chunk = Buffer.from(chunk, encoding).toString()
    } else if (Buffer.isBuffer(chunk))
      chunk = chunk.toString()
    }
    if (typeof encoding === 'function') {
      cb = encoding
    }
    const jsonData = (this._jsonBuffer + chunk).split('\n')
    this._jsonBuffer = jsonData.pop()
    for (let i = 0; i < jsonData.length; i++) {
      let parsed
      try {
        super.write(parsed)
      } catch (er) {
        this.emit('error', er)
        continue
      }
    }
    if (cb)
      cb()
  }
}
```
