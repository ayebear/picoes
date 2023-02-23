/**
 * Utility function for invoking methods inside objects, binding "this" to the object.
 *
 * @ignore
 *
 * @param {Object}   object - The object
 * @param {Function} method - The method
 * @param {Array}    args   - The arguments
 *
 * @return {Object} Returns what the called method returns
 */
export function invoke(object, method, ...args) {
  if (object && typeof object[method] === 'function') {
    return object[method].call(object, ...args)
  }
}

/**
 * Shallow clones any type of variable.
 *
 * @ignore
 */
export function shallowClone(val) {
  if (Array.isArray(val)) {
    return [...val]
  } else if (typeof val === 'object') {
    return { ...val }
  }
  return val
}

/**
 * Tests if an entity's data is empty in O(1)
 *
 * @ignore
 */
export function isEntityEmpty(obj) {
  for (const key in obj) {
    if (key === 'entity') continue
    return false
  }
  return true
}
