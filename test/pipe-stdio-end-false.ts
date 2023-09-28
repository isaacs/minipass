import t from 'tap'
import type { Minipass } from '../src/index.js'

t.test('pipe to stdout', async t => {
  const proc: { stdout?: Minipass<string>, stderr?: Minipass<string> } = {}
  t.intercept(global, 'process', { value: proc })
  const { Minipass } = await t.mockImport('../src/index.js') as typeof import('../src/index.js')
  proc.stdout = new Minipass<string>({ encoding: 'utf8' })
  proc.stdout.on('end', () => {
    throw new Error('stdout should not end')
  })
  proc.stderr = new Minipass<string>({ encoding: 'utf8' })
  proc.stderr.on('end', () => {
    throw new Error('stderr should not end')
  })

  const src = new Minipass<string>({encoding:'utf8'})
  src.pipe(proc.stdout)
  src.pipe(proc.stderr)
  src.end('hello, stdio')
  await new Promise<void>(r => setTimeout(r))
})
