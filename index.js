'use strict'
const EE = require('events')
const Yallist = require('yallist')
const EOF = Symbol('EOF')
const MAYBE_EMIT_END = Symbol('maybeEmitEnd')
const EMITTED_END = Symbol('emittedEnd')
const READ = Symbol('read')
const FLUSH = Symbol('flush')
const FLUSHCHUNK = Symbol('flushChunk')
const SD = require('string_decoder').StringDecoder
const ENCODING = Symbol('encoding')
const DECODER = Symbol('decoder')
const FLOWING = Symbol('flowing')

class MiniPass extends EE {
  constructor (options) {
    super()
    this[FLOWING] = false
    this.pipes = new Yallist()
    this.buffer = new Yallist()
    this[ENCODING] = options && options.encoding || null
    if (this[ENCODING] === 'buffer')
      this[ENCODING] = null
    this[DECODER] = this[ENCODING] ? new SD(this[ENCODING]) : null
    this[EOF] = false
    this[EMITTED_END] = false
  }

  get encoding () { return this[ENCODING] }
  set encoding (enc) {
    if (enc !== this[ENCODING])
      this[DECODER] = enc ? new SD(enc) : null
    this[ENCODING] = enc
  }

  setEncoding (enc) {
    this.encoding = enc
  }

  get writable () { return true }
  get readable () { return true }

  write (chunk, encoding, cb) {
    if (this[EOF])
      throw new Error('write after end')

    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8'

    if (typeof chunk === 'string')
      chunk = new Buffer(chunk, encoding)

    try {
      return this.flowing
        ? (this.emit('data', chunk), true)
        : (this.buffer.push(chunk), false)
    } finally {
      this.emit('readable')
      if (cb)
        cb()
    }
  }

  read (n) {
    try {
      if (!this.buffer.length || n === 0)
        return null

      if (this.buffer.length > 1)
        this.buffer = new Yallist([Buffer.concat(Array.from(this.buffer))])

      return this[READ](n || null, this.buffer.head.value)
    } finally {
      this[MAYBE_EMIT_END]()
    }
  }

  [READ] (n, chunk) {
    if (n > chunk.length)
      return null
    else if (n === chunk.length || n === null)
      this.buffer.pop()
    else {
      this.buffer.head.value = chunk.slice(n)
      chunk = chunk.slice(0, n)
    }

    this.emit('data', chunk)
    return chunk
  }

  end (chunk, encoding, cb) {
    if (typeof chunk === 'function')
      cb = chunk, chunk = null
    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8'
    if (chunk)
      this.write(chunk, encoding)
    if (cb)
      this.once('end', cb)
    this[EOF] = true
    if (this.flowing)
      this[MAYBE_EMIT_END]()
  }

  resume () {
    this[FLOWING] = true
    if (this.buffer.length)
      this[FLUSH]()
    else
      this[MAYBE_EMIT_END]()
  }

  pause () {
    this[FLOWING] = false
  }

  get flowing () {
    return this[FLOWING]
  }

  [FLUSH] () {
    do {} while (this[FLUSHCHUNK](this.buffer.shift()))

    if (!this.buffer.length)
      this.emit('drain')
  }

  [FLUSHCHUNK] (chunk) {
    return chunk ? (this.emit('data', chunk), this.flowing) : false
  }

  pipe (dest) {
    this.pipes.push(dest)
    dest.on('drain', _ => this.resume())
    this.resume()
    return dest
  }

  addEventHandler (ev, fn) {
    return this.on(ev, fn)
  }

  on (ev, fn) {
    try {
      return super.on(ev, fn)
    } finally {
      if (ev === 'data' && !this.pipes.length && !this.flowing)
        this.resume()
    }
  }

  get emittedEnd () {
    return this[EMITTED_END]
  }

  [MAYBE_EMIT_END] () {
    if (!this[EMITTED_END] && this.buffer.length === 0 && this[EOF]) {
      this.emit('end')
      this.emit('finished')
      this.emit('close')
    }
  }

  emit (ev, data, ...args) {
    if (ev === 'data') {
      if (this[DECODER])
        data = this[DECODER].write(data)

      if (!data)
        return

      if (this.pipes.length)
        this.pipes.forEach(dest => dest.write(data) || this.pause())
    } else if (ev === 'end') {
      if (this[DECODER]) {
        data = this[DECODER].end()
        if (data) {
          this.pipes.forEach(dest => dest.write(data))
          super.emit('data', data)
        }
      }
      this.pipes.forEach(dest => {
        if (dest !== process.stdout && dest !== process.stderr)
          dest.end()
      })
      this[EMITTED_END] = true
    }

    try {
      return super.emit(ev, data, ...args)
    } finally {
      if (ev !== 'end')
        this[MAYBE_EMIT_END]()
    }
  }
}

module.exports = MiniPass
