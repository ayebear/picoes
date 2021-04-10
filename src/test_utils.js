export function getSize(it) {
  let num = 0
  for (let _elem in it) {
    ++num
  }
  return num
}

export function has(it, target) {
  for (let elem of it) {
    if (elem.id === target.id) {
      return true
    }
  }
  return false
}

// TODO: Result of mocha/chai to jest upgrade, remove and use jest's "expect"
export function assert(value) {
  expect(Boolean(value)).toBe(true)
}
