import t from 'tap'
import { Minipass as MP } from '../src/index.js'
const mp = new MP()
t.equal(mp.end(), mp, 'end returns this')
