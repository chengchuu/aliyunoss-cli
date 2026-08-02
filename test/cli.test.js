const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

test('loads the CommonJS package entrypoint', () => {
  assert.equal(typeof require('..'), 'function')
})

test('prints CLI help without starting an upload', () => {
  const result = spawnSync(process.execPath, ['bin/index.js', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })

  assert.equal(result.status, 0)
  assert.match(result.stdout, /Usage: aliyunoss-cli \[options\]/)
})
