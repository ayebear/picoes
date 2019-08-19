const { World } = require('../index.js')
const { SimpleIndex } = require('./simple_index.js')
const { MemoizedQueryIndex } = require('./memoized_query_index.js')
const indexers = [SimpleIndex, MemoizedQueryIndex]

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

function testIndexers(callback) {
	return function() {
		for (let indexer of indexers) {
			callback(new World(indexer))
		}
	}
}

// TODO: Result of mocha/chai to jest upgrade, remove and use jest's "expect"
function assert(value) {
	expect(Boolean(value)).toBe(true)
}

module.exports = {
    getSize,
    has,
    testIndexers,
    assert
}