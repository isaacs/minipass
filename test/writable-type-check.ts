import { Minipass } from '../src/index.js'

let tester: NodeJS.WritableStream
tester = new Minipass()
tester = new Minipass<Buffer>()
tester = new Minipass<Buffer | string>()
tester = new Minipass<Buffer, Minipass.ContiguousData>()
tester = new Minipass<string>({ encoding: 'hex' })
tester = new Minipass<string, Buffer | string>({ encoding: 'hex' })
tester = new Minipass<Buffer, string>()

// We expect this one to be an error, because the NodeJS.WritableStream
// does not allow objectMode streams, so it would be a problem to use an
// OM minipass in contexts where a NodeJS.WritableStream is expected.
//@ts-expect-error
tester = new Minipass<{ a: 1 }>({ objectMode: true })

// so the linter doesn't complain about unused variable
tester

import { pass } from 'tap'
pass(`just making sure TS doesn't complain`)
