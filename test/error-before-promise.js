const MP = require('../')
const t = require('tap')

t.test('emit an error before calling stream.promise()', t => {
  const mp = new MP()
  const poop = new Error('poop')
  mp.once('error', er => t.equal(er, poop))
  mp.emit('error', poop)
  mp.end()
  return t.rejects(mp.promise(), poop)
})

t.test('end properly when emitting error event', t => {
  // this simulates a case where the 'emit' method is overridden
  // in a child class to do special behavior on the 'end' event,
  // which can cause an error to be emitted, in which case we
  // still need to try to re-emit end if the error is handled.
  // See http://npm.im/minipass-flush
  const mp = new MP()
  const poop = new Error('poop')
  mp.on('error', er => t.equal(er, poop, 'catch all'))
  let mpEnded = false
  mp.on('end', () => {
    mpEnded = true
    t.pass('emitted mp end event')
    if (pipelineEnded)
      t.end()
  })
  const { emit } = mp
  let flushed = false
  let flushing = false
  mp.emit = (ev, ...data) => {
    if (ev !== 'end' || flushed)
      return emit.call(mp, ev, ...data)

    if (flushing)
      return

    if (ev === 'end') {
      flushing = true
      Promise.resolve().then(() => {
        flushed = true
        mp.emit('error', poop)
      })
    } else {
      return emit.call(mp, ev, ...data)
    }
  }
  const src = new MP()
  const dest = new MP()
  let pipelineEnded = false
  mp.pipe(dest)
    .on('data', c => {
      t.equal(c.toString(), 'ok')
    })
    .on('end', () => {
      pipelineEnded = true
      t.pass('pipeline ended')
      if (mpEnded)
        t.end()
    })
  mp.end()
})
