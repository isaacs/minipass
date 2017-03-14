const EE = require('events')
const Yallist = require('yallist')
const EOF = Symbol('EOF')
const READ = Symbol('read')
const SD = require('string_decoder').StringDecoder

class MiniPass extends EE {
  constructor (options) {
    super()
    this.flowing = false
    this.pipes = new Yallist()
    this.buffer = new Yallist()
    this.encoding = options && options.encoding || null
    if (this.encoding === 'buffer')
      this.encoding = null
    this.decoder = this.encoding ? new SD(this.encoding) : null
    this[EOF] = false
  }

  write (chunk, encoding = 'utf8', cb = null) {
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
    if (!this.buffer.length || n === 0)
      return null

    if (this.buffer.length > 1)
      this.buffer = new Yallist([Buffer.concat(Array.from(this.buffer))])

    return this[READ](n, this.buffer.head.value)
  }

  [READ] (n, chunk) {
    if (n > chunk.length)
      return null
    else if (n === chunk.length)
      this.buffer.pop()
    else {
      this.buffer.head.value = chunk.slice(n)
      chunk = chunk.slice(0, n)
    }

    this.emit('data', chunk)
    return chunk
  }

  end (chunk) {
    if (chunk)
      this.write(chunk)
    this[EOF] = true
    if (this.buffer.length === 0)
      this.flush()
  }

  resume () {
    this.flowing = true
    if (this.buffer.length)
      this.flush()
  }

  pause () {
    this.flowing = false
  }

  flush () {
    do {} while (this.flushChunk(this.buffer.shift()))

    if (!this.buffer.length)
      this.emit('drain')
  }

  flushChunk (chunk) {
    return chunk ? (this.emit('data', chunk), this.flowing) : false
  }

  pipe (dest) {
    this.pipes.push(dest)
    dest.on('drain', _ => this.resume())
    this.resume()
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

  emit (ev, data, ...args) {
    if (ev === 'data') {
      if (this.decoder)
        data = this.decoder.write(data)

      if (!data)
        return

      if (this.pipes.length)
        this.pipes.forEach(dest => dest.write(data) || this.pause())
    } else if (ev === 'end') {
      if (this.decoder) {
        data = this.decoder.end()
        if (data) {
          this.pipes.forEach(dest => dest.write(data))
          super.emit('data', data)
        }
      }
      this.pipes.forEach(dest => dest.end())
    }

    try {
      return super.emit(ev, data, ...args)
    } finally {
      if (ev !== 'end' && this.buffer.length === 0 && this[EOF])
        this.emit('end')
    }
  }
}

module.exports = MiniPass
