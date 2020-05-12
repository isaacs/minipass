const MP = require('../')
const t = require('tap')

t.test('do not emit drain if already ended', async t => {
  const mp = new MP({ encoding: 'utf8' })
  let drains = 0
  mp.on('drain', () => drains ++)

  t.equal(mp.write('hello'), false, 'first write returns false')
  t.equal(mp.write('world'), false, 'second write returns false')
  mp.end()

  const data = await mp.concat()
  t.equal(data, 'helloworld')
  t.equal(drains, 0)
})

t.test('emit drain if buffer clears after a write', async t => {
  const mp = new MP({ encoding: 'utf8' })
  let drains = 0
  mp.on('drain', () => drains ++)

  t.equal(mp.write('hello'), false, 'first write returns false')
  process.nextTick(() => {
    t.equal(mp.write('world'), true, 'second write returns true')
    mp.end()
  })
  const data = await mp.concat()
  t.equal(data, 'helloworld')
  t.equal(drains, 1)
})

t.test('emit drain 1 time if buffer clears after 2 writes', async t => {
  const mp = new MP({ encoding: 'utf8' })
  let drains = 0
  mp.on('drain', () => drains ++)

  t.equal(mp.write('hello'), false, 'first write returns false')
  t.equal(mp.write('world'), false, 'second write returns false')
  process.nextTick(() => mp.end())

  const data = await mp.concat()
  t.equal(data, 'helloworld')
  t.equal(drains, 1)
})

t.test('no drain if buffer clears during write on readable event', async t => {
  const mp = new MP({ encoding: 'utf8' })
  let drains = 0
  mp.on('drain', () => drains ++)

  let data = ''
  mp.on('readable', () => data += mp.read())

  t.equal(mp.write('hello'), true, 'first write returns true')
  t.equal(mp.write('world'), true, 'second write returns true')
  mp.end()

  t.equal(data, 'helloworld')
  t.equal(drains, 0, 'no drains, cleared the buffer immediately on each write')
})

t.test('emit drain if buffer clears in readable after write', async t => {
  const mp = new MP({ encoding: 'utf8' })
  let drains = 0
  mp.on('drain', () => drains ++)
  let readables = 0
  mp.on('readable', () => readables ++)

  t.equal(mp.write('hello'), false, 'first write returns false')
  t.equal(mp.write('world'), false, 'second write returns false')

  let data = ''
  mp.on('readable', () => data += mp.read())

  t.equal(data, 'helloworld')
  t.equal(drains, 1, 'emitted drain when buffer was cleared')
  t.equal(readables, 3, 'readable events emitted - 2 during write, 1 for new listener')
})

t.test('even spurious manual drain wont break it', async t => {
  const mp = new MP({ encoding: 'utf8' })
  let drains = 0
  mp.on('drain', () => drains ++)
  let readables = 0
  mp.on('readable', () => readables ++)

  t.equal(mp.write('hello'), false, 'first write returns false')
  t.equal(mp.write('world'), false, 'second write returns false')

  let data = ''
  mp.on('readable', () => data += mp.read())

  // try to emit some extra drains, ensure that nothing wrong happens
  mp.emit('drain')
  mp.emit('drain')
  mp.emit('drain')
  mp.emit('drain')
  mp.emit('drain')

  t.equal(data, 'helloworld')
  t.equal(drains, 1, 'emitted drain when buffer was cleared')
  t.equal(readables, 3, 'readable events emitted - 2 during write, 1 for new listener')
})
