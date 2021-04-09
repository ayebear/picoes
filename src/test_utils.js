function getSize(it) {
  let num = 0
  for (let elem of it) {
    ++num
  }
  return num
}

function has(it, target) {
  for (let elem of it) {
    if (elem.toString() == target.toString()) {
      return true
    }
  }
  return false
}

// TODO: Result of mocha/chai to jest upgrade, remove and use jest's "expect"
function assert(value) {
  expect(Boolean(value)).toBe(true)
}

module.exports = {
  getSize,
  has,
  assert,
}
