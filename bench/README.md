Stream Benchmarks

Run `node index.js` to benchmark all the different stream implementations
with the following configurations:

- `implementation` One of the implementations in `./impls`
- `case` How is the data emitted and how is it consumed?
    - `fast-fast` Source emits data as fast as possible, destination
      consumes it immediately.
    - `fast-slow` Source emits data as fast as possible, destination
      consumes one chunk per Promise cycle.
    - `slow-fast` Source emits one data per Promise cycle, destination
      consumes it immediately.
    - `slow-slow` Source emits one data per Promise cycle, destination
      consumes one chunk per Promise cycle.
    - `fast-mixed` Source emits data as fast as possible, data is piped to
      one fast destination stream and one slow destination stream.
- `pipeline` How many instances of the tested implementation are piped
  together between the source and destination?  Tested with `1` and `20` by
  default.
- `type` What kind of data is written?
    - `defaults` a buffer
    - `str` a string
    - `obj` the object `{i: 'object'}`

Results are written to the `./results` folder for each test case, and to
`results.json` and `results.tab`.

See [this google
sheet](https://docs.google.com/spreadsheets/d/1K_HR5oh3r80b8WVMWCPPjfuWXUgfkmhlX7FGI6JJ8tY/edit?usp=sharing)
for analysis and comparisons.
