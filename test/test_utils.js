export function getSize(it) {
  let num = 0
  for (const key in it) {
    if (key !== 'entity') ++num
  }
  return num
}

export function has(it, target) {
  for (const elem of it) {
    if (elem.id === target.id) {
      return true
    }
  }
  return false
}
