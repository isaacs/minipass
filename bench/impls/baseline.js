// piping to /dev/null
module.exports = class BaselineNoOpStream {
  constructor () {
    this.pipeDests = []
  }
  write () { return true }
  end () {
    this.pipeDests.forEach(d => d.end())
    return this
  }
  pipe (d) {
    this.pipeDests.push(d)
    return d
  }
  read () { return null }
  on () { return this }
  emit () {}
}
