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
function invoke(object, method, ...args) {
	if (object && typeof object[method] === 'function') {
		return object[method].call(object, ...args)
	}
}

// TODO: Delete this
/**
 * Determines if function.
 *
 * @ignore
 */
function isFunction(obj) {
	return typeof obj === 'function'
}

/**
 * Shallow clones any type of variable.
 *
 * @ignore
 */
function shallowClone(val) {
	if (Array.isArray(val)) {
		return [...val]
	} else if (typeof val === 'object') {
		return {...val}
	}
	return val
}

exports.invoke = invoke
exports.isFunction = isFunction
exports.shallowClone = shallowClone
