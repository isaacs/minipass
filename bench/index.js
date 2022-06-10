// if you go much higher the core streams just choke and take forever lol
const N = Math.floor(128*1024 / Math.PI)
const fs = require('fs')
// const { basename } = require('path')
// const impls = fs.readdirSync(__dirname + '/impls')
//   .filter(f => /\.js$/.test(f)).map(f => basename(f, '.js'))
const impls = [
  'baseline',
  'minipass-latest',
  'minipass-current',
  'minipass-current-async',
  'extend-minipass-current',
  'core-extend-transform',
  'core-passthrough',
]

const promiseSpawn = require('@npmcli/promise-spawn')

const main = async () => {
  const [node, _, impl, cse, len, type] = process.argv
  const opt = { stdioString: true, stdio: ['ignore', 'pipe', 'inherit'] }
  const results = {}
  if (impl === undefined) {
    // run against all implementations
    const a = [__filename]
    for (const i of impls) {
      const res = await promiseSpawn(process.execPath, [...a, i], opt)
        .catch(e => e)
      try {
        results[i] = JSON.parse(res.stdout)
      } catch (e) {
        results[i] = e
      }
    }
  } else if (cse === undefined) {
    const a = [__filename, impl]
    for (const c of cases) {
      const res = await promiseSpawn(process.execPath, [...a, c], opt)
        .catch(e => e)
      try {
        results[c] = JSON.parse(res.stdout)
      } catch (e) {
        results[c] = e
      }
    }
  } else if (len === undefined) {
    const a = [__filename, impl, cse]
    for (const l of pipeLen) {
      const res = await promiseSpawn(process.execPath, [...a, l], opt)
        .catch(e => e)
      try {
        results[l] = JSON.parse(res.stdout)
      } catch (e) {
        results[l] = e
      }
    }
  } else {
    const fs = require('fs')
    const dir = __dirname + '/results'
    fs.mkdirSync(dir, { recursive: true })

    // ok, actually run this one case and return the score
    const opts = {
      defaults: {},
      str: {encoding:'utf8'},
      obj: {objectMode: true},
    }
    const typeOpts = type ? [[type, opts[type]]] : Object.entries(opts)
    for (const [name, opt] of typeOpts) {
      await new Promise((res, rej) => {
        process.stderr.write(`${impl} ${cse} ${len} ${name} ... `)
        const { src, start, dest, dest2 } = setupPipeline(impl, len, cse, opt)
        const end = () => {
          const result = performance.now() - startTime
          results[name] = result
          console.error(result)
          res()
        }
        let ended1 = false
        let ended2 = !dest2
        if (dest2) {
          dest2.on('finish', () => {
            if (ended2) throw new Error('emitted multiple dest2.finish')
            ended2 = true
            if (ended1) {
              end()
            }
          })
        }
        dest.on('finish', () => {
          if (ended1) throw new Error('emitted multiple dest1.finish')
          ended1 = true
          if (ended2) {
            end()
          }
        })
        // kick it off!
        const startTime = performance.now()
        src.pipe(start).on('error', rej)
      }).catch(e => results[name] = e)
    }
    fs.writeFileSync(`${dir}/${impl}-${cse}-${len}.json`,
      JSON.stringify(results, 0, 2))
  }

  console.log(JSON.stringify(results, 0, 2))
  fs.writeFileSync('results.json', JSON.stringify(results, 0, 2) + '\n')

  // write out the results.tab from the top level
  if (impl === undefined) {
    const header = ['impl', 'case', 'pipeline', 'type', 'time', 'score']
    const rows = []
    let max = -1
    for (const [impl, iRes] of Object.entries(results)) {
      for (const [cse, cRes] of Object.entries(iRes)) {
        for (const [len, lRes] of Object.entries(cRes)) {
          for (const [type, time] of Object.entries(lRes)) {
            max = Math.max(max, time)
            rows.push([impl, cse, len, type, time])
          }
        }
      }
    }
    for (const row of rows) {
      row.push(max / row[row.length - 1])
    }
    const output = [header].concat(rows.sort((a, b) => a[a.length-1] - b[b.length-1]))
      .map(row => row.join('\t'))
      .join('\n') + '\n'
    fs.writeFileSync(__dirname + '/results.tab', output)
  }
}

// is the src and dest fast or slow?
const cases = [
  'fast-fast',
  'fast-slow',
  'slow-fast',
  'slow-slow',
  'fast-mixed', // two dests: 1 fast, 1 slow
]

// how many of the stream under test piped together?
const pipeLen = [ 1, 20 ]

const EE = require('events')

const setupPipeline = (impl, len, cse, opt) => {
  const Cls = require(`./impls/${impl}.js`)
  let s = new Cls(opt)
  let start = s
  while (len > 1) {
    s = s.pipe(new Cls(opt))
    len --
  }

  let src
  let dest
  let dest2
  switch (cse) {
    case 'fast-fast':
      src = new FastSrc(opt)
      dest = new FastDest(opt)
      break
    case 'fast-slow':
      src = new FastSrc(opt)
      dest = new SlowDest(opt)
      break
    case 'slow-fast':
      src = new SlowSrc(opt)
      dest = new FastDest(opt)
      break
    case 'slow-slow':
      src = new SlowSrc(opt)
      dest = new SlowDest(opt)
      break
    case 'fast-mixed':
      src = new FastSrc(opt)
      dest = new FastDest(opt)
      dest2 = new SlowDest(opt)
      break
    default:
      throw new Error('unknown case: ' + cse)
  }
  s.pipe(dest)
  if (dest2) {
    s.pipe(dest2)
  }
  return { src, start, dest, dest2 }
}

class Src extends EE {
  constructor (options) {
    super()
    this.chunk = options.objectMode ? { i: 'object' }
      : options.encoding ? 'x'.repeat(N)
      : Buffer.from('x'.repeat(N))
    this.n = N
    this.flowing = false
    this.readable = true
    this.writable = false
  }
  pipe (dest) {
    dest.on('drain', () => this.resume())
    this.on('data', c => dest.write(c) === false ? this.pause() : true)
    this.on('end', () => dest.end())
    this.resume()
    return dest
  }
  pause () {
    this.flowing = false
  }
}
class FastSrc extends Src {
  resume () {
    if (this.flowing) {
      return
    }
    this.flowing = true
    while (this.n > 0 && this.flowing) {
      this.emit('data', this.chunk)
      this.n --
    }
    if (this.flowing && this.n === 0) {
      this.emit('end')
    }
  }
}
class SlowSrc extends Src {
  resume () {
    if (this.flowing) {
      return
    }
    this.flowing = true
    const doResume = () => {
      if (!this.flowing ) {
        return
      }
      if (this.flowing && this.n > 0) {
        this.emit('data', this.chunk)
        this.n --
        return Promise.resolve().then(doResume)
      }
      if (this.flowing && this.n <= 0) {
        this.emit('end')
        return
      }
    }
    Promise.resolve().then(doResume)
  }
}

class Dest extends EE {
  constructor () {
    super()
    this.writable = true
    this.readable = false
    this.ended = false
    this.buffering = false
  }
}
class FastDest extends Dest {
  write (c) {
    if (this.ended) {
      throw new Error('write after end in '+this.constructor.name)
    }
    return true
  }
  end () {
    this.ended = true
    return this.emit('finish')
  }
}
class SlowDest extends Dest {
  write (c) {
    if (this.ended) {
      throw new Error('write after end in '+this.constructor.name)
    }
    this.buffering = true
    Promise.resolve().then(() => {
      this.buffering = false
      this.emit('drain')
    })
    return false
  }
  end () {
    this.ended = true
    if (this.buffering) {
      this.once('drain', () => this.end())
    } else {
      Promise.resolve().then(() => this.emit('finish'))
    }
    return this
  }
}

main()
