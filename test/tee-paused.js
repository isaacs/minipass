const t = require('tap')

const MP = require('../')
const src = new MP({ encoding: 'utf8' })
src.write('hello')
src.pause()

const d1 = new MP({ encoding: 'utf8' })
const d2 = new MP({ encoding: 'utf8' })
src.pipe(d1)
src.end(' world')
src.pipe(d2)

t.test('everyone gets the right data', t => Promise.all([
  d1.concat(),
  d2.concat(),
  src.concat(),
]).then(([res1, res2, resSrc]) => {
  t.equal(res1, 'hello world', 'd1 got correct data')
  t.equal(res2, 'hello world', 'd2 got correct data')
  t.equal(resSrc, 'hello world', 'src got correct data')
}))

src.resume()
