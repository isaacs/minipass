'use strict'
const t = require('tap')
const MP = require('../index.js')

t.test('sync iteration', t => {
  const cases = {
    'buffer': [ null, [
      Buffer.from('ab'),
      Buffer.from('cd'),
      Buffer.from('e')
    ]],
    'string': [ { encoding: 'utf8' }, ['ab', 'cd', 'e']],
    'object': [ { objectMode: true }, ['a', 'b', 'c', 'd', 'e']]
  }
  const runTest = (c, opt, expect) => {
    t.test(c, t => {
      const result = []
      const mp = new MP(opt)
      mp.write('a')
      mp.write('b')
      for (let letter of mp) {
        result.push(letter)
      }
      mp.write('c')
      mp.write('d')
      result.push.call(result, ...mp)
      mp.write('e')
      mp.end()
      for (let letter of mp) {
        result.push(letter) // e
      }
      for (let letter of mp) {
        result.push(letter) // nothing
      }
      t.match(result, expect)
      t.end()
    })
  }

  for (let c in cases) {
    runTest(c, cases[c][0], cases[c][1])
  }

  t.test('destroy while iterating', t => {
    const mp = new MP({ objectMode: true })
    mp.write('a')
    mp.write('b')
    mp.write('c')
    mp.write('d')
    const result = []
    for (let letter of mp) {
      result.push(letter)
      mp.destroy()
    }
    t.same(result, ['a'])
    t.end()
  })

  t.end()
})

t.test('async iteration', t => {
  const expect = [
    'start\n',
    'foo\n',
    'foo\n',
    'foo\n',
    'foo\n',
    'foo\n',
    'bar\n'
  ]

  t.test('end immediate', async t => {
    const mp = new MP({ encoding: 'utf8' })
    let i = 5

    mp.write('start\n')
    const inter = setInterval(() => {
      if (i --> 0)
        mp.write(Buffer.from('foo\n', 'utf8'))
      else {
        mp.end('bar\n')
        clearInterval(inter)
      }
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result, expect)
  })

  t.test('end later', async t => {
    const mp = new MP({ encoding: 'utf8' })
    let i = 5

    mp.write('start\n')
    const inter = setInterval(() => {
      if (i --> 0)
        mp.write(Buffer.from('foo\n', 'utf8'))
      else {
        mp.write('bar\n')
        setTimeout(() => mp.end())
        clearInterval(inter)
      }
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result, expect)
  })

  t.test('multiple chunks at once, asyncly', async t => {
    const mp = new MP()
    let i = 6
    const write = () => {
      if (i === 6)
        mp.write(Buffer.from('start\n', 'utf8'))
      else if (i > 0)
        mp.write('foo\n')
      else if (i === 0) {
        mp.end('bar\n')
        clearInterval(inter)
      }
      i--
    }

    const inter = setInterval(() => {
      write()
      write()
      write()
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result.map(x => x.toString()).join(''), expect.join(''))
  })

  t.test('multiple object chunks at once, asyncly', async t => {
    const mp = new MP({ objectMode: true })
    let i = 6
    const write = () => {
      if (i === 6)
        mp.write(['start\n'])
      else if (i > 0)
        mp.write(['foo\n'])
      else if (i === 0) {
        mp.end(['bar\n'])
        clearInterval(inter)
      }
      i--
    }

    const inter = setInterval(() => {
      write()
      write()
      write()
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result.map(x => x.join('')).join(''), expect.join(''))
  })

  t.test('all chunks at once, asyncly', async t => {
    const mp = new MP()
    setTimeout(() => {
      mp.write(Buffer.from('start\n', 'utf8'))
      for (let i = 0; i < 5; i++) {
        mp.write('foo\n')
      }
      mp.end('bar\n')
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result.map(x => x.toString()).join(''), expect.join(''))
  })

  t.test('all object chunks at once, asyncly', async t => {
    const mp = new MP({ objectMode: true })
    setTimeout(() => {
      mp.write(['start\n'])
      for (let i = 0; i < 5; i++) {
        mp.write(['foo\n'])
      }
      mp.end(['bar\n'])
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result.map(x => x.join('')).join(''), expect.join(''))
  })

  t.test('all object chunks at once, syncly', async t => {
    const mp = new MP({ objectMode: true })
    mp.write(['start\n'])
    for (let i = 0; i < 5; i++) {
      mp.write(['foo\n'])
    }
    mp.end(['bar\n'])

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result.map(x => x.join('')).join(''), expect.join(''))
  })

  t.test('pipe in all at once', async t => {
    const inp = new MP({ encoding: 'utf8' })
    const mp = new MP({ encoding: 'utf8' })
    inp.pipe(mp)

    let i = 5
    inp.write('start\n')
    const inter = setInterval(() => {
      if (i --> 0)
        inp.write(Buffer.from('foo\n', 'utf8'))
      else {
        inp.end('bar\n')
        clearInterval(inter)
      }
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result, expect)
  })

  t.test('pipe in multiple object chunks at once, asyncly', async t => {
    const mp = new MP({ objectMode: true })
    const inp = new MP({ objectMode: true })
    inp.pipe(mp)

    let i = 5
    inp.write(['start\n'])
    const write = () => {
      if (i > 0)
        inp.write(['foo\n'])
      else if (i === 0) {
        inp.end(['bar\n'])
        clearInterval(inter)
      }
      i--
    }

    const inter = setInterval(() => {
      write()
      write()
      write()
    })

    const result = []
    for await (let x of mp)
      result.push(x)

    t.same(result.map(x => x.join('')).join(''), expect.join(''))
  })

  t.test('throw error', async t => {
    const mp = new MP()
    const poop = new Error('poop')
    setTimeout(() => {
      mp.read = () => { throw poop }
      mp.end('this is fine')
    })
    const result = []
    const run = async () => {
      for await (let x of mp) {
        result.push(x)
      }
    }

    await t.rejects(run, poop)
  })

  t.test('emit error', async t => {
    const mp = new MP()
    const poop = new Error('poop')
    setTimeout(() => mp.emit('error', poop))
    const result = []
    const run = async () => {
      for await (let x of mp) {
        result.push(x)
      }
    }

    await t.rejects(run, poop)
  })

  t.test('destroy', async t => {
    const mp = new MP()
    const poop = new Error('poop')
    setTimeout(() => mp.destroy())
    const result = []
    const run = async () => {
      for await (let x of mp) {
        result.push(x)
      }
    }

    await t.rejects(run, { message: 'stream destroyed' })
  })

  t.end()
})
