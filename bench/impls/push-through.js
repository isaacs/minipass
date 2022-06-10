// This is a minimal non-EE stream class inspired by push-stream
// It can support multiple outputs, but only one input.
class PushThrough {
  constructor (opt) {
    this.dests = []
    this.paused = false
    this.buffer = []
    this.ended = false
    this.ondrain = []
    this.onfinish = []
  }

  on (ev, fn) {
    switch (ev) {
      case 'error': break
      case 'finish':
        this.onfinish.push(fn)
        break
      case 'drain':
        this.ondrain.push(fn)
        break
      default:
        throw new Error(`event ${ev} not supported`)
    }
  }

  once (ev, fn) {
    const f = () => {
      fn()
      this[`on${ev}`] = this[`on${ev}`].filter(fn => fn !== f)
    }
    this.on(ev, f)
  }

  emit (ev) {
    switch (ev) {
      case 'finish':
        this.onfinish.forEach(f => f())
        break
      case 'drain':
        this.ondrain.forEach(f => f())
        break
      default:
        throw new Error(`event ${ev} not supported`)
    }
  }

  pipe (dest) {
    this.dests.push(dest)
    dest.on('drain', () => this.resume())
    this.resume()
  }

  resume () {
    this.paused = false
    if (this.buffer.length) {
      const b = this.buffer.slice(0)
      this.buffer.length = 0
      for (const c of b) {
        for (const dest of this.dests) {
          const ret = dest.write(c)
          this.paused = this.paused || ret === false
        }
      }
    }
    if (this.buffer.length === 0) this.emit('drain')
    if (this.ended && this.buffer.length === 0) {
      for (const d of this.dests) {
        d.end()
      }
      this.emit('finish')
    }
  }

  pause () {
    this.paused = true
  }

  write (chunk) {
    if (this.ended) {
      throw new Error('write after end')
    }
    if (!this.dests.length || this.paused) {
      this.buffer.push(chunk)
      return false
    }
    for (const dest of this.dests) {
      const ret = dest.write(chunk)
      this.paused = this.paused || ret === false
    }
    return !this.paused
  }

  end () {
    this.ended = true
    this.resume()
  }

}

module.exports = PushThrough
