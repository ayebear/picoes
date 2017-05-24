function invoke(object, method, ...args) {
	if (object && typeof object[method] === 'function') {
		return object[method].call(object, ...args)
	}
}

exports.invoke = invoke
