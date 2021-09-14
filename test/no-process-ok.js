const tap = require('tap')
const proc = global.process
global.process = null
const MP = require('../')
const src = new MP()
const dest = new MP({ encoding: 'utf8' })
src.pipe(dest)
src.end('ok')
const result = dest.read()
global.process = proc
const t = require('tap')
t.equal(result, 'ok')
