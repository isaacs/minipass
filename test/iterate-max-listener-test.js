const t = require('tap')
const MP = require('../')

// make warnings throw
Object.defineProperty(process, 'emitWarning', {
  value: (...args) => {
    throw new Error('got warning: ' + args.join(', '))
  }
})

// create a stream that emits a bunch of things in chunks
const chunks = []
for (let i = 0; i < 10000; i++) {
  chunks.push(String(i))
}
class EmitterStream extends MP {
  constructor () {
    super({ encoding: 'utf8' })
    this.i = 0
    this.p = new Promise(resolve => this.resolve = resolve)
    this.interval = setInterval(() => {
      for (let j = 0; j < 500 && this.i < chunks.length; j++) {
        this.write(chunks[this.i++])
      }
      if (this.i === chunks.length) {
        clearInterval(this.interval)
        this.end()
        this.resolve()
      }
    })
  }
}

t.test('async iterate the emitter stream', async t => {
  const actual = []
  const s = new EmitterStream()
  for await (const chunk of s) {
    actual.push(chunk)
  }
  t.same(actual.join(''), chunks.join(''), 'got expected chunks')
})

t.test('sync iterate the emitter stream repeatedly', async t => {
  const actual = []
  const s = new EmitterStream()
  s.on('readable', () => {
    for (const chunk of s) {
      if (!chunk) break
      actual.push(chunk)
    }
  })
  s.on('end', () => {
    t.same(actual.join(''), chunks.join(''), 'got expected chunks')
  })
})

t.test('sync iterate the emitter stream after completion', async t => {
  const actual = []
  const s = new EmitterStream()
  await s.p
  for (const chunk of s) {
    actual.push(chunk)
  }
  t.same(actual.join(''), chunks.join(''), 'got expected chunks')
})
