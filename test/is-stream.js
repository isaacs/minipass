const MP = require('../')
const EE = require('events')
const t = require('tap')
const Stream = require('stream')

t.equal(MP.isStream(new MP), true, 'a MiniPass is a stream')
t.equal(MP.isStream(new Stream), true, 'a Stream is a stream')
t.equal((new MP) instanceof Stream, true, 'a MiniPass is a Stream')
const w = new EE()
w.write = () => {}
w.end = () => {}
t.equal(MP.isStream(w), true, 'EE with write() and end() is a stream')
const r = new EE()
r.pipe = () => {}
t.equal(MP.isStream(r), true, 'EE with pipe() is a stream')
t.equal(MP.isStream(new Stream.Readable()), true, 'Stream.Readable() is a stream')
t.equal(MP.isStream(new Stream.Writable()), true, 'Stream.Writable() is a stream')
t.equal(MP.isStream(new Stream.Duplex()), true, 'Stream.Duplex() is a stream')
t.equal(MP.isStream(new Stream.Transform()), true, 'Stream.Transform() is a stream')
t.equal(MP.isStream(new Stream.PassThrough()), true, 'Stream.PassThrough() is a stream')
t.equal(MP.isStream(new (class extends MP {})), true, 'extends MP is a stream')
t.equal(MP.isStream(new EE), false, 'EE without streaminess is not a stream')
t.equal(MP.isStream({
  write(){},
  end(){},
  pipe(){},
}), false, 'non-EE is not a stream')
t.equal(MP.isStream('hello'), false, 'string is not a stream')
t.equal(MP.isStream(99), false, 'number is not a stream')
t.equal(MP.isStream(() => {}), false, 'function is not a stream')
t.equal(MP.isStream(null), false, 'null is not a stream')
