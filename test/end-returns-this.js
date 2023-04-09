const t = require('tap')
const { Minipass: MP } = require('../')
const mp = new MP()
t.equal(mp.end(), mp, 'end returns this')
