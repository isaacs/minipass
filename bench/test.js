'use strict'

const iterations = +process.env.BENCH_TEST_ITERATION || 100
const testCount = +process.env.BENCH_TEST_COUNT || 20

const tests = [
  'through2',
  'extend-through2',
  'minipass',
  'extend-minipass',
  'passthrough',
  'extend-transform'
]
const manyOpts = [ 'many', 'single' ]
const typeOpts = [ 'buffer', 'string', 'object' ]

const main = () => {
  const spawn = require('child_process').spawn
  const node = process.execPath

  const results = {}

  const testSet = []
  tests.forEach(t =>
    manyOpts.forEach(many =>
      typeOpts.forEach(type =>
        new Array(testCount).join(',').split(',').forEach(() =>
          testSet.push([t, many, type])))))

  let didFirst = false
  const mainRunTest = t => {
    if (!t)
      return afterMain(results)

    const k = t.join('\t')
    if (!results[k]) {
      results[k] = []
      if (!didFirst)
        didFirst = true
      else
        process.stderr.write('\n')

      process.stderr.write(k + ' #')
    } else {
      process.stderr.write('#')
    }

    const c = spawn(node, [__filename].concat(t), {
      stdio: [ 'ignore', 'pipe', 2 ]
    })
    let out = ''
    c.stdout.on('data', c => out += c)
    c.on('close', (code, signal) => {
      if (code || signal)
        throw new Error('failed: ' + code + ' ' + signal)
      results[k].push(+out)
      mainRunTest(testSet.shift())
    })
  }

  mainRunTest(testSet.shift())
}

const afterMain = results => {
  console.log('test\tmany\ttype\tmean\tmedian\tstdev\trange\traw\t' +
              'iterations=%d\tcount=%d', iterations, testCount)
  // get the mean, median, stddev, and range of each test
  Object.keys(results).forEach(test => {
    const k = results[test].sort()
    const min = k[0]
    const max = k[ k.length - 1 ]
    const range = max - min
    const sum = k.reduce((a,b) => a + b, 0)
    const mean = sum / k.length
    const devs = k.map(n => n - mean).map(n => n * n)
    const avgdev = devs.reduce((a,b) => a + b, 0) / k.length
    const stdev = Math.pow(avgdev, 0.5)
    const median = k.length % 2 ? k[Math.floor(k.length / 2)] :
      (k[k.length/2] + k[k.length/2+1])/2
    console.log(
      '%s\t%d\t%d\t%d\t%d\t%s', test, mean, median, stdev, range,
      k.join('\t'))
  })
}

const test = (testname, many, type) => {
  const timer = require('./lib/timer.js')
  const Class = getClass(testname)
  if (!Class)
    throw new Error('unknown test: ' + testname)

  const done = timer()
  runTest(Class, many, type, iterations, done)
}

// don't blow up the stack! loop unless deferred
const runTest = (Class, many, type, iterations, done) => {
  const Nullsink = require('./lib/nullsink.js')
  const Numbers = require('./lib/numbers.js')
  const opt = {}
  if (type === 'string')
    opt.encoding = 'utf8'
  else if (type === 'object')
    opt.objectMode = true

  while (iterations--) {
    let finished = false
    let inloop = true
    const after = iterations === 0 ? done
      : () => {
        if (iterations === 0)
          done()
        else if (inloop)
          finished = true
        else
          runTest(Class, many, type, iterations, done)
      }

    const out = new Nullsink().on('finish', after)
    let sink = new Class(opt)

    if (many)
      sink = sink
        .pipe(new Class(opt))
        .pipe(new Class(opt))
        .pipe(new Class(opt))
        .pipe(new Class(opt))

    sink.pipe(out)
    new Numbers(opt).pipe(sink)

    // keep tight-looping if the stream is done already
    if (!finished) {
      inloop = false
      break
    }
  }
}

const getClass = testname =>
  testname === 'through2' ? require('through2').obj
  : testname === 'extend-through2' ? require('./lib/extend-through2.js')
  : testname === 'minipass' ? require('../')
  : testname === 'extend-minipass' ? require('./lib/extend-minipass.js')
  : testname === 'passthrough' ? require('stream').PassThrough
  : testname === 'extend-transform' ? require('./lib/extend-transform.js')
  : null

if (!process.argv[2])
  main()
else
  test(process.argv[2], process.argv[3] === 'many', process.argv[4])