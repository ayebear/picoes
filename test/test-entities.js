// import 'es.js'
let es = require('../src/picoes.js')
let assert = require('chai').assert

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min
}

describe('World', function() {
	describe('component()', function () {
		it('define a component', function () {
			let world = new es.World()
			world.component('position', function(x = 0, y = 0) {
				this.x = x
				this.y = y
			})
			let ent = world.entity().set('position', 1, 2)
			assert('position' in world.components)
			assert(Object.keys(world.components).length == 1)
			assert(ent.has('position'))
			assert(ent.get('position').x === 1)
			assert(ent.get('position').y === 2)
		})
		it('define an object component', function () {
			let world = new es.World()
			world.component('position', {
				x: 0,
				y: 0
			})
			let ent = world.entity().update('position', {
				x: 1,
				y: 2
			})
			let ent2 = world.entity().update('position', {
				x: 1
			})
			assert('position' in world.components)
			assert(Object.keys(world.components).length == 1)
			assert(ent.has('position'))
			assert(ent.get('position').x === 1)
			assert(ent.get('position').y === 2)
			assert(ent2.has('position'))
			assert(ent2.get('position').x === 1)
			assert(ent2.get('position').y === 0)
		})
		it('define an empty component', function () {
			let world = new es.World()
			world.component('position')
			let ent = world.entity().update('position', {
				x: 1
			})
			assert('position' in world.components)
			assert(Object.keys(world.components).length == 1)
			assert(ent.has('position'))
			assert(ent.get('position').x === 1)
			assert(!('y' in ent.get('position')))
		})
	})

	describe('system()', function() {
		it('define a system', function() {
			let world = new es.World()
			world.component('position')
			world.system(['position'], class {})
			assert(world.systems.length == 1)
		})
		it('system iteration', function() {
			let world = new es.World()
			world.component('position')
			world.component('velocity')
			world.system(['position', 'velocity'], class {
				every(position, velocity, ent) {
					assert(position)
					assert(velocity)
					position.x += velocity.x
					position.y += velocity.y
					assert(ent)
					assert(ent.has('position'))
					assert(ent.has('velocity'))
				}
			})
			let entA = world.entity()
			let entB = world.entity()
			entA.update('position', {x: 1, y: 1}).update('velocity', {x: 1, y: 0})
			entB.update('position', {x: 30, y: 40}).update('velocity', {x: -1, y: 2})

			assert(entA.get('position').x == 1 && entA.get('position').y == 1)
			assert(entB.get('position').x == 30 && entB.get('position').y == 40)

			world.run()

			assert(entA.get('position').x == 2 && entA.get('position').y == 1)
			assert(entB.get('position').x == 29 && entB.get('position').y == 42)

			world.run()

			assert(entA.get('position').x == 3 && entA.get('position').y == 1)
			assert(entB.get('position').x == 28 && entB.get('position').y == 44)
		})
	})

	describe('entity()', function() {
		it('create an entity', function() {
			let world = new es.World()
			world.component('position')
			let ent = world.entity()
			assert(Object.keys(world.entities).length == 1)
		})
		it('support components', function() {
			let world = new es.World()
			world.component('position', function(x = 0, y = 0) {
				this.x = x
				this.y = y
			})
			world.component('object', {
				val: 0,
				test: 1
			})
			world.component('empty')
			let ent = world.entity()
			ent.set('position', 5)
			assert(Object.keys(ent.data).length == 1)
			assert(ent.get('position').x === 5)
			assert(ent.get('position').y === 0)

			ent.update('position', {y: 3})
			assert(Object.keys(ent.data).length == 1)
			assert(ent.get('position').x === 5)
			assert(ent.get('position').y === 3)

			ent.update('object', {val: 50})
			assert(Object.keys(ent.data).length == 2)
			assert(ent.get('object').val === 50)
			assert(ent.get('object').test === 1)

			ent.update('empty', {testing: 100})
			assert(Object.keys(ent.data).length == 3)
			assert(ent.get('empty').testing === 100)
		})
		it('remove components', function() {
			let world = new es.World()
			world.component('position')
			world.component('velocity')
			let ent = world.entity().set('position').set('velocity')
			assert(Object.keys(ent.data).length == 2)
			assert(ent.has('position'))
			assert(ent.has('velocity'))

			ent.remove('position')
			assert(Object.keys(ent.data).length == 1)
			assert(!ent.has('position'))
			assert(ent.has('velocity'))

			ent.remove('velocity')
			assert(Object.keys(ent.data).length == 0)
			assert(!ent.has('position'))
			assert(!ent.has('velocity'))

			ent.set('position').set('velocity')
			assert(Object.keys(ent.data).length == 2)
			assert(ent.has('position'))
			assert(ent.has('velocity'))
			ent.removeAll()
			assert(Object.keys(ent.data).length == 0)
			assert(!ent.has('position'))
			assert(!ent.has('velocity'))
		})
		it('serialize components', function() {
			let world = new es.World()
			world.component('position')
			let ent = world.entity().update('position', {x: 4, y: 6})

			let data = JSON.parse(ent.toJson())
			assert(data)
			assert(data.position)
			assert(data.position.x === 4)
			assert(data.position.y === 6)
		})
		it('deserialize components', function() {
			let world = new es.World()
			world.component('position')
			let ent = world.entity()
			assert(Object.keys(ent.data).length == 0)

			ent.fromJson('{"position": {"x": 4, "y": 6}}')
			assert(ent.has('position'))
			assert(Object.keys(ent.data).length == 1)
			assert(ent.get('position'))
			assert(ent.get('position').x === 4)
			assert(ent.get('position').y === 6)
		})
	})

	describe('Performance', function() {
		this.timeout(10000)

		it('should be fast', function() {
			let world = new es.World()
			world.component('compA', function(val) {
				this.val = val
			})
			world.component('compB', {
				val: 0,
				val2: 0
			})
			world.component('compC')

			// Create some entities, randomly add components to them
			let start = new Date()
			let count = 10000
			for (let i = 0; i < count; ++i) {
				let ent = world.entity()
				ent.set('compA', 5)
				if (getRandomInt(1, 100) < 50) {
					ent.update('compB', {val: 7})
				}
				if (getRandomInt(1, 100) > 50) {
					ent.update('compC', {val: 42})
				}
			}
			let end = new Date()
			let elapsed = (end - start) / 1000
			let speed = count / elapsed
			console.log('\tBenchmark A: ' + speed + ' entities/second')

			// Query for entities
			start = new Date()

			world.every(['compA', 'compB'], function(compA, compB) {
				compA.newVal = compB.val
			})

			end = new Date()
			elapsed = (end - start) / 1000
			speed = count / elapsed
			console.log('\tBenchmark B: ' + speed + ' entities/second')
		})
	})
})
