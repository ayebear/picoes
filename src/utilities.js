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

exports.invoke = invoke
