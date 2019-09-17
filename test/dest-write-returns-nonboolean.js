const t = require('tap')
const MP = require('../')

t.test('writing to a non-bool returning write() does not pause', t => {
  const booleyStream = new (class extends MP {
    write (chunk, encoding, cb) {
      // no return!
      super.write(chunk, encoding, cb)
    }
  })

  const booleyStream2 = new (class extends MP {
    write (chunk, encoding, cb) {
      // no return!
      super.write(chunk, encoding, cb)
    }
  })


  const src = new MP

  try {
    return src.pipe(booleyStream).pipe(booleyStream2).concat().then(d =>
      t.equal(d.toString(), 'hello', 'got data all the way through'))
  } finally {
    src.end('hello')
  }
})
