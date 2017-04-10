const MiniPass = require('../')
const t = require('tap')

t.test('some basic piping and writing', async t => {
  let mp = new MiniPass({ encoding: 'base64' })
  t.notOk(mp.flowing)
  mp.flowing = true
  t.notOk(mp.flowing)
  t.equal(mp.encoding, 'base64')
  mp.encoding = null
  t.equal(mp.encoding, null)
  t.equal(mp.readable, true)
  t.equal(mp.writable, true)
  t.equal(mp.write('hello'), false)
  let dest = new MiniPass()
  let sawDestData = false
  dest.once('data', chunk => {
    sawDestData = true
    t.isa(chunk, Buffer)
  })
  t.equal(mp.pipe(dest), dest, 'pipe returns dest')
  t.ok(sawDestData, 'got data becasue pipe() flushes')
  t.equal(mp.write('bye'), true, 'write() returns true when flowing')
  dest.pause()
  t.equal(mp.write('after pause'), true, 'true when dest is paused')
  t.equal(mp.write('after false'), false, 'false when not flowing')
  t.equal(dest.buffer.length, 1, '1 item is buffered in dest')
  t.equal(mp.buffer.length, 1, '1 item buffered in src')
  dest.resume()
  t.equal(dest.buffer.length, 0, 'nothing is buffered in dest')
  t.equal(mp.buffer.length, 0, 'nothing buffered in src')
})

t.test('unicode splitting', async t => {
  const butterfly = '🦋'
  const mp = new MiniPass({ encoding: 'utf8' })
  t.plan(2)
  t.equal(mp.encoding, 'utf8')
  mp.on('data', chunk => {
    t.equal(chunk, butterfly)
  })
  const butterbuf = new Buffer([0xf0, 0x9f, 0xa6, 0x8b])
  mp.write(butterbuf.slice(0, 1))
  mp.write(butterbuf.slice(1, 2))
  mp.write(butterbuf.slice(2, 3))
  mp.write(butterbuf.slice(3, 4))
  mp.end()
})

t.test('unicode splitting with setEncoding', async t => {
  const butterfly = '🦋'
  const mp = new MiniPass({ encoding: 'hex' })
  t.plan(4)
  t.equal(mp.encoding, 'hex')
  mp.setEncoding('hex')
  t.equal(mp.encoding, 'hex')
  mp.setEncoding('utf8')
  t.equal(mp.encoding, 'utf8')
  mp.on('data', chunk => {
    t.equal(chunk, butterfly)
  })
  const butterbuf = new Buffer([0xf0, 0x9f, 0xa6, 0x8b])
  mp.write(butterbuf.slice(0, 1))
  mp.write(butterbuf.slice(1, 2))
  mp.write(butterbuf.slice(2, 3))
  mp.write(butterbuf.slice(3, 4))
  mp.end()
})

t.test('base64 -> utf8 piping', t => {
  t.plan(1)
  const butterfly = '🦋'
  const mp = new MiniPass({ encoding: 'base64' })
  const dest = new MiniPass({ encoding: 'utf8' })
  mp.pipe(dest)
  let out = ''
  dest.on('data', c => out += c)
  dest.on('end', _ =>
    t.equal(new Buffer(out, 'base64').toString('utf8'), butterfly))
  mp.write(butterfly)
  mp.end()
})

t.test('utf8 -> base64 piping', t => {
  t.plan(1)
  const butterfly = '🦋'
  const mp = new MiniPass({ encoding: 'utf8' })
  const dest = new MiniPass({ encoding: 'base64' })
  mp.pipe(dest)
  let out = ''
  dest.on('data', c => out += c)
  dest.on('end', _ =>
    t.equal(new Buffer(out, 'base64').toString('utf8'), butterfly))
  mp.write(butterfly)
  mp.end()
})

t.test('read method', async t => {
  const butterfly = '🦋'
  const mp = new MiniPass({ encoding: 'utf8' })
  mp.on('data', c => t.equal(c, butterfly))
  mp.pause()
  mp.write(new Buffer(butterfly))
  t.equal(mp.read(5), null)
  t.equal(mp.read(0), null)
  t.same(mp.read(4), new Buffer(butterfly))
})

t.test('read with no args', async t => {
  const butterfly = '🦋'
  const mp = new MiniPass({ encoding: 'utf8' })
  mp.on('data', c => t.equal(c, butterfly))
  mp.pause()
  mp.write(new Buffer(butterfly))
  t.same(mp.read(), new Buffer(butterfly))
  t.equal(mp.read(), null)
})

t.test('partial read', async t => {
  const butterfly = '🦋'
  const mp = new MiniPass()
  const butterbuf = new Buffer(butterfly)
  mp.write(butterbuf.slice(0, 1))
  mp.write(butterbuf.slice(1, 2))
  mp.write(butterbuf.slice(2, 3))
  mp.write(butterbuf.slice(3, 4))
  t.equal(mp.read(5), null)
  t.equal(mp.read(0), null)
  t.same(mp.read(2), butterbuf.slice(0, 2))
  t.same(mp.read(2), butterbuf.slice(2, 4))
})

t.test('write after end', async t => {
  const mp = new MiniPass()
  let sawEnd = false
  mp.on('end', _ => sawEnd = true)
  mp.end()
  t.throws(_ => mp.write('nope'))
  t.notOk(sawEnd, 'should not get end event yet (not flowing)')
  mp.resume()
  t.ok(sawEnd, 'should get end event after resume()')
})

t.test('write cb', async t => {
  const mp = new MiniPass()
  let calledCb = false
  mp.write('ok', () => calledCb = true)
  t.ok(calledCb)
})

t.test('end with chunk', async t => {
  let out = ''
  const mp = new MiniPass({ encoding: 'utf8' })
  let sawEnd = false
  mp.on('end', _ => sawEnd = true)
  mp.addEventHandler('data', c => out += c)
  let endCb = false
  mp.end('ok', _ => endCb = true)
  t.equal(out, 'ok')
  t.ok(sawEnd, 'should see end event')
  t.ok(endCb, 'end cb should get called')
})

t.test('no drain if could not entirely drain on resume', async t => {
  const mp = new MiniPass()
  const dest = new MiniPass({ encoding: 'buffer' })
  t.equal(mp.write('foo'), false)
  t.equal(mp.write('bar'), false)
  t.equal(mp.write('baz'), false)
  t.equal(mp.write('qux'), false)
  mp.on('drain', _ => t.fail('should not drain'))
  mp.pipe(dest)
})

t.test('end with chunk pending', async t => {
  const mp = new MiniPass()
  t.equal(mp.write('foo'), false)
  t.equal(mp.write('626172', 'hex'), false)
  t.equal(mp.write('baz'), false)
  t.equal(mp.write('qux'), false)
  let sawEnd = false
  mp.on('end', _ => sawEnd = true)
  let endCb = false
  mp.end(_ => endCb = true)
  t.notOk(endCb, 'endcb should not happen yet')
  t.notOk(sawEnd, 'should not see end yet')
  let out = ''
  mp.on('data', c => out += c)
  t.ok(sawEnd, 'see end after flush')
  t.ok(endCb, 'end cb after flush')
  t.equal(out, 'foobarbazqux')
})

t.test('pipe to stderr does not throw', t => {
  const spawn = require('child_process').spawn
  const module = JSON.stringify(require.resolve('../'))
  const fs = require('fs')
  const file = __dirname + '/prog.js'
  fs.writeFileSync(file, `
    const MP = require(${module})
    const mp = new MP()
    mp.pipe(process.stderr)
    mp.end("hello")
  `)
  let err = ''
  return new Promise(res => {
    const child = spawn(process.execPath, [file])
    child.stderr.on('data', c => err += c)
    child.on('close', (code, signal) => {
      t.equal(code, 0)
      t.equal(signal, null)
      t.equal(err, 'hello')
      fs.unlinkSync(file)
      res()
    })
  })
})

t.test('emit works with many args', t => {
  const mp = new MiniPass()
  t.plan(2)
  mp.on('foo', function (a, b, c, d, e, f, g) {
    t.same([a,b,c,d,e,f,g], [1,2,3,4,5,6,7])
    t.equal(arguments.length, 7)
  })
  mp.emit('foo', 1, 2, 3, 4, 5, 6, 7)
})
