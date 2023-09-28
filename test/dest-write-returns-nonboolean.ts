import t from 'tap'
import { Minipass as MP } from '../src/index.js'

t.test(
  'writing to a non-bool returning write() does not pause',
  async t => {
    const booleyStream = new (class extends MP {
      //@ts-ignore
      write(
        chunk: MP.ContiguousData,
        encoding?: MP.Encoding | (() => void) | undefined,
        cb?: (() => void) | undefined
      ): void {
        // no return!
        super.write(
          chunk,
          typeof encoding === 'function' ? undefined : encoding,
          typeof encoding === 'function' ? encoding : cb
        )
      }
    })()

    const booleyStream2 = new (class extends MP {
      //@ts-ignore
      write(
        chunk: MP.ContiguousData,
        encoding?: MP.Encoding | (() => void) | undefined,
        cb?: (() => void) | undefined
      ): void {
        // no return!
        super.write(
          chunk,
          typeof encoding === 'function' ? undefined : encoding,
          typeof encoding === 'function' ? encoding : cb
        )
      }
    })()

    const src = new MP()

    src.end('hello')
    const d = await src.pipe(booleyStream).pipe(booleyStream2).concat()
    t.equal(d.toString(), 'hello', 'got data all the way through')
  }
)
