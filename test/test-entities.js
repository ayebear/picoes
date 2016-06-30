// import 'es.js'
let es = require('../src/picoes.js')
let assert = require('chai').assert

describe('World', function() {
	describe('component()', function () {
		let world = new es.World()

		world.component('position', function(x, y) {
			this.x = x
			this.y = y
		})

		it('should define a component', function () {
			assert('position' in world.components)
		})
	})
})
