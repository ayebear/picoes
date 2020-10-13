const { World } = require('../index.js')
const { Entity } = require('./entity.js')
const {
    getSize,
    has,
    testIndexers,
    assert
} = require('./test_utils.js')

test('world: create a world', () => {
	const world = new World()
	assert(world instanceof World)
	assert(typeof world.component === 'function')
})

test('component: define a component', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y

		this.inc = (a) => {
			return a + 1
		}
	})
	let ent = world.entity().set('position', 1, 2)
	assert('position' in world.components)
	assert(Object.keys(world.components).length == 1)
	assert(ent.has('position'))
	assert(ent.get('position').x === 1)
	assert(ent.get('position').y === 2)
	assert(ent.get('position').inc(5) === 6)

	// Using class syntax
	world.component('velocity', class {
		constructor(entity, x = 0, y = 0) {
			this.x = x
			this.y = y
		}

		inc(a) {
			return a + 1
		}
	})
	let ent2 = world.entity().set('velocity', 1, 2)
	assert('velocity' in world.components)
	assert(Object.keys(world.components).length == 2)
	assert(ent2.has('velocity'))
	assert(ent2.get('velocity').x === 1)
	assert(ent2.get('velocity').y === 2)
	assert(ent2.get('velocity').inc(5) === 6)

	// Should throw when calling "components" setter
	expect(() => (ent2.components = ['anything'])).toThrow()
}))

test('component: README example', testIndexers(world => {
	// Create player
	let player = world.entity().set('health', { value: 100 })

	// Create enemies
	world.entity().set('damages', 10)
	world.entity().set('damages', 30)

	// Apply damage
	world.each('damages', ({damages: amount}) => {
		player.get('health').value -= amount
	})

	// Player now has reduced health
	assert(player.get('health').value === 60)
}))

test('component: define an object component (should be invalid)', testIndexers(world => {
	let result = world.component('position', {
		x: 0,
		y: 0
	})
	assert(result === undefined)
	let result2 = world.component('invalid', 555)
	assert(result2 === undefined)
	assert(Object.keys(world.components).length === 0)
}))

test('component: define an empty component', testIndexers(world => {
	let result = world.component('position')
	assert(result === undefined)
}))

test('component: use an empty component', testIndexers(world => {
	let ent = world.entity().update('position', {
		x: 1
	})
	assert(ent.has('position'))
	assert(ent.get('position').x === 1)

	let ent2 = world.entity().set('velocity', {
		x: 2
	})
	assert(ent2.has('velocity'))
	assert(ent2.get('velocity').x === 2)
	ent2.set('velocity', {
		y: 3
	})
	assert(ent2.get('velocity').x === undefined)
	assert(ent2.get('velocity').y === 3)
	ent2.update('velocity', {
		x: 42
	})
	assert(ent2.get('velocity').x === 42)
	assert(ent2.get('velocity').y === 3)

	let ent3 = world.entity().set('singleValue', 5)
	assert(ent3.has('singleValue'))
	assert(ent3.get('singleValue') === 5)
	ent3.set('singleValue', 500)
	assert(ent3.get('singleValue') === 500)

	let ent4 = world.entity().set('string', 'hello')
	assert(ent4.has('string'))
	assert(ent4.get('string') === 'hello')
	ent4.set('string', 'goodbye')
	assert(ent4.get('string') === 'goodbye')

	ent4.remove('string')
	assert(!ent4.has('string'))
}))

test('component: test clearing with indexes', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	})
	world.component('velocity')
	world.component('sprite')
	let results = world.each()
	results = world.each('position')
	results = world.each('position', 'velocity')

	world.entity().set('position', 1, 2).set('velocity')
	world.entity().set('position', 3, 4).set('velocity')
	world.entity().set('position', 5, 6)
	world.entity().set('velocity')

	let count = 0
	world.each('position', ({position}) => {
		assert(position.x >= 1)
		assert(position.y >= 2)
		++count
	})
	assert(count === 3)

	world.clear()

	count = 0
	world.each('position', ({position}) => {
		++count
	})
	world.each((_, ent) => {
		++count
	})
	assert(count === 0)
}))

test('component: test entity creation with constructor parameters', testIndexers(world => {
	let when = 0
	world.component('sprite', class {
		onCreate(entity, texture, size, invalid) {
			this.entity = entity
			this.texture = texture
			this.size = size
			this.constructorCalled = ++when
			assert(texture && texture === this.texture)
			assert(size && size === this.size)
			assert(invalid === undefined)

			// Regression in 0.3.0, fixed in 0.3.1
			assert(entity.get('sprite') === this)
		}
	})

	let ent = world.entity().set('sprite', 'test.png', 100)
	assert(ent.get('sprite').constructorCalled === 1)
	assert(ent.get('sprite').entity === ent)
	assert(ent.get('sprite').texture === 'test.png')
	assert(ent.get('sprite').size === 100)

}))

test('component: test clearing with onRemove', testIndexers(world => {
	let spriteCount = 0
	world.component('sprite', class {
		constructor() {
			++spriteCount
		}

		onRemove() {
			--spriteCount
		}
	})

	let ent = world.entity().set('sprite')
	assert(spriteCount === 1)

	let ent2 = world.entity().set('sprite')
	assert(spriteCount === 2)

	world.clear()
	assert(spriteCount === 0)
}))

test('component: test detach and attach', testIndexers(world => {
	let spriteCount = 0
	world.component('sprite', class {
		constructor() {
			++spriteCount
		}

		onRemove() {
			--spriteCount
		}
	})

	let ent = world.entity().set('sprite').set('position', {x: 1})
	assert(spriteCount === 1)

	let ent2 = world.entity().set('sprite').set('position', {x: 2})
	assert(spriteCount === 2)

	// Test detaching
	assert(ent.valid())
	ent.detach()
	assert(!ent.valid())
	assert(spriteCount === 2)
	assert(world.entities.size === 1)
	assert(getSize(world.each('position')) === 1)
	assert(world.get('position').length === 1)
	assert(world.get('position')[0].get('position').x === 2)
	assert(ent.get('position').x === 1)

	// Test attaching
	ent.attach(world)
	assert(ent.valid())
	assert(spriteCount === 2)
	assert(world.entities.size === 2)
	assert(getSize(world.each('position')) === 2)
	assert(world.get('position').length === 2)
	assert(ent.get('position').x === 1)

	// Test edge cases
	ent.detach()
	assert(!ent.valid())
	ent.detach()
	assert(!ent.valid())
	ent.attach()
	assert(!ent.valid())
	ent.attach(world)
	assert(ent.valid())
}))

test('component: test detached entities', testIndexers(world => {
	let ent = world.entity()
		.set('sprite', {texture: 'image.png'})
		.set('position', 5)

	assert(ent.valid())
	assert(ent.has('sprite'))
	assert(ent.has('position'))
	assert(ent.get('sprite').texture === 'image.png')
	assert(ent.get('position') === 5)

	ent.detach()

	assert(!ent.valid())
	assert(ent.has('sprite'))
	assert(ent.has('position'))
	assert(ent.get('sprite').texture === 'image.png')
	assert(ent.get('position') === 5)

	ent.set('velocity', {x: 10})
	assert(ent.has('velocity'))
	assert(ent.get('velocity').x === 10)

	ent.set('position', 6)
	assert(ent.has('position'))
	assert(ent.get('position') === 6)

	ent.remove('position')
	assert(!ent.has('position'))

	// Create entity outside of the world
	let ent2 = new Entity()
	assert(!ent2.valid())
	ent2.set('velocity', {x: 30})
	ent2.set('position', 7)
	assert(ent2.has('velocity', 'position'))
	assert(ent2.get('velocity').x === 30)
	assert(ent2.get('position') === 7)
	ent2.removeAll()
	assert(!ent2.has('velocity'))
	assert(!ent2.has('position'))
}))

test('system: define a system', testIndexers(world => {
	world.system(class {})
	assert(world.systems.length == 1)
}))

test('system: define a system with arguments', testIndexers(world => {
	let velocitySystem = class {
		constructor(maxVelocity, canvas, textures) {
			this.maxVelocity = maxVelocity
			this.canvas = canvas
			this.textures = textures
		}
	}
	world.component('velocity')
	world.system(velocitySystem, 3500, 'someCanvas', ['textures.png'])
	assert(world.systems[0].maxVelocity === 3500)
	assert(world.systems[0].canvas === 'someCanvas')
	assert(world.systems[0].textures[0] === 'textures.png')
}))

test('system: system iteration', testIndexers(world => {
	world.component('position')
	world.component('velocity')
	world.system(class {
		run(dt, total) {
			assert(dt > 0)
			assert(total > 0)
			world.each('position', 'velocity', ({ position, velocity }, ent) => {
				assert(position)
				assert(velocity)
				position.x += velocity.x
				position.y += velocity.y
				assert(ent)
				assert(ent.has('position'))
				assert(ent.has('velocity'))
				assert(dt > 0)
				assert(total > 0)
			})
		}
	})

	let dt = 0.1667
	let total = dt

	let entA = world.entity()
	let entB = world.entity()
	let entC = world.entity()
	entA.update('position', {x: 1, y: 1}).update('velocity', {x: 1, y: 0})
	entB.update('position', {x: 30, y: 40}).update('velocity', {x: -1, y: 2})

	assert(entA.get('position').x == 1 && entA.get('position').y == 1)
	assert(entB.get('position').x == 30 && entB.get('position').y == 40)

	world.run(dt, total)

	assert(entA.get('position').x == 2 && entA.get('position').y == 1)
	assert(entB.get('position').x == 29 && entB.get('position').y == 42)

	total += dt
	world.run(dt, total)

	assert(entA.get('position').x == 3 && entA.get('position').y == 1)
	assert(entB.get('position').x == 28 && entB.get('position').y == 44)
}))

test('system: system methods', testIndexers(world => {
	world.component('position')

	let methodsCalled = 0

	world.system(class {
		constructor() {
			this.val = 10
			++methodsCalled
		}
		run() {
			++methodsCalled
			assert(this.val === 10)
			world.each('position', ({position}) => {
				position.x = 1
				++methodsCalled
				assert(this.val === 10)
			})
		}
	})

	world.system(class {})
	world.system()

	let ent = world.entity().set('position')
	assert(methodsCalled == 1)
	world.run()
	assert(methodsCalled == 3)
}))

test('system: system edge cases', testIndexers(world => {
	world.component('position')
	world.component('velocity')

	let testEnt0 = world.entity().set('position').set('velocity')
	let testEnt2 = null
	for (let i = 0; i < 100; ++i) {
		let tmpEnt = world.entity()
		tmpEnt.set('position').set('velocity')
		if (i == 80) {
			testEnt2 = tmpEnt
		}
	}

	let testEnt1 = world.entity().set('position').set('velocity')
	let count = 0

	world.system(class {
		run() {
			world.each(['position', 'velocity'], ({position, velocity}, ent) => {
				++count
				if (count == 1) {
					testEnt1.removeAll()
					testEnt2.remove('position')
					testEnt0.remove('velocity')
					return
				}
				assert(position)
				assert(velocity)
				position.x += velocity.x
				position.y += velocity.y
				assert(ent)
				assert(ent.has('position'))
				assert(ent.has('velocity'))

				// Make sure the test entities do not show up here
				assert(ent.id !== testEnt0.id)
				assert(ent.id !== testEnt1.id)
				assert(ent.id !== testEnt2.id)
			})
		}
	})
	let entA = world.entity()
	let entB = world.entity()
	let entC = world.entity()
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
}))

test('system: adding entities to index', testIndexers(world => {
	world.entity().set('a').set('b')
	assert(world.get('a', 'b').length === 1)
	world.get('a', 'b')[0].destroy()
	assert(world.get('a', 'b').length === 0)
	world.entity().set('a')
	assert(world.get('a', 'b').length === 0)
	world.entity().set('b')
	assert(world.get('a', 'b').length === 0)
	world.entity().set('b').set('a')
	assert(world.get('a', 'b').length === 1)
}))

test('system: onRemove edge cases', testIndexers(world => {
	world.component('position', class {
		onCreate(entity, value) {
			this.entity = entity
			this.value = value
		}

		onRemove() {
			this.entity.set('somethingElse')
		}
	})

	let entity = world.entity().set('position')

	expect(() => entity.destroy()).toThrow()
}))

test('system: indexing edge cases', testIndexers(world => {
	// This test was to discover the "adding entities to index" and "onRemove edge cases" tests above
	// Keeping it in case there are other problems in the future

	let g = { count: 0 }

	// Define components
	world.component('position', class {
		onCreate(entity, x = 0, y = 0) {
			this.entity = entity
			this.x = x
			this.y = y
		}
	})
	world.component('velocity', class {
		onCreate(entity, x = 0, y = 0) {
			this.entity = entity
			this.x = x
			this.y = y
		}
	})
	world.component('sprite', class {
		onCreate(entity, texture) {
			this.entity = entity
			this.texture = texture
		}

		onRemove() {
			g.entity.set('sideEffect', ++g.count)
		}
	})

	const REPEAT = 3

	for (let i = 0; i < REPEAT; ++i) {

		g.count = 0

		// Create test entities
		world.entity().set('noOtherComponents', 0)
		world.entity().set('position', 1)
		g.entity = world.entity().set('velocity', 2)
		world.entity().set('sprite', 'three')
		world.entity().set('position', 4).set('velocity', 4)
		world.entity().set('position', 5).set('velocity', 5).set('sprite', 'five')
		world.entity().set('position', 6).set('sprite', 'six')
		world.entity().set('velocity', 7).set('sprite', 'seven')

		// Ensure initial indexes are good
		for (let i = 0; i < REPEAT; ++i) {
			assert(world.get('noOtherComponents').length === 1)
			assert(world.get('sideEffect').length === 0)
			assert(world.get('sprite').length === 4)
			assert(world.get('velocity').length === 4)
			assert(world.get().length === 8)
			assert(world.get('position').length === 4)
			assert(world.get('position', 'velocity').length === 2)
			assert(world.get('position', 'sprite').length === 2)
			assert(world.get('position', 'velocity', 'sprite').length === 1)
			assert(world.get('velocity', 'sprite').length === 2)
		}

		// Remove test entities, create more test entities
		let count = 0
		world.each('sprite', ({sprite}, entity) => { ++count; entity.destroy() })
		assert(count === 4)

		count = 0
		world.each('sprite', ({sprite}, entity) => { ++count; entity.destroy() })
		assert(count === 0)


		assert(g.count === 4)

		// Ensure indexes are still good
		for (let i = 0; i < REPEAT; ++i) {
			assert(world.get().length === 4)
			assert(world.get('noOtherComponents').length === 1)
			assert(world.get('sideEffect').length === 1)
			assert(world.get('sprite').length === 0)
			assert(world.get('velocity').length === 2)
			assert(world.get('position').length === 2)
		}

		count = 0
		world.each('velocity', ({velocity}, entity) => { ++count; entity.destroy() })
		assert(count === 2)

		count = 0
		world.each('velocity', ({velocity}, entity) => { ++count; entity.destroy() })
		assert(count === 0)

		// Ensure indexes are still good
		for (let i = 0; i < REPEAT; ++i) {
			assert(world.get().length === 2)
			assert(world.get('noOtherComponents').length === 1)
			assert(world.get('sideEffect').length === 0)
			assert(world.get('sprite').length === 0)
			assert(world.get('velocity').length === 0)
			assert(world.get('position').length === 1)
		}

		count = 0
		world.each('position', ({position}, entity) => { ++count; entity.destroy() })
		assert(count === 1)

		count = 0
		world.each('position', ({position}, entity) => { ++count; entity.destroy() })
		assert(count === 0)

		world.get('noOtherComponents')[0].destroy()

		// Ensure new indexes are good
		for (let i = 0; i < REPEAT; ++i) {
			assert(world.get().length === 0)
			assert(world.get('noOtherComponents').length === 0)
			assert(world.get('sideEffect').length === 0)
			assert(world.get('sprite').length === 0)
			assert(world.get('velocity').length === 0)
			assert(world.get('position').length === 0)
		}
	}
}))

test('system: system variadic arguments with optional components', testIndexers(world => {
	let created = false
	world.system(class {
		constructor(first, second) {
			assert(first === 1)
			assert(second === 2)
			created = true
		}
	}, 1, 2)
	assert(created)
}))

test('system: use the each() method', testIndexers(world => {
	let ent1 = world.entity().set('position').set('"velocity"')
	let ent2 = world.entity().set('position')
	let ent3 = world.entity().set('position:"velocity"')
	let externalVar = 5
	world.each('position', ({position: pos}, ent) => {
		assert(pos)
		assert(ent)
		assert(ent.has('position'))
		assert(externalVar === 5)
	})
	world.each('position', function({position: pos}, ent) {
		assert(pos)
		assert(ent)
		assert(ent.has('position'))
		assert(externalVar === 5)
	})

	// Test hash collisions and escaping
	world.each('position:"velocity"')
	let count = 0
	world.each('position', '"velocity"', function({position: pos, ['"velocity"']: vel}, ent) {
		assert(pos)
		assert(vel)
		assert(ent)
		assert(ent.has('position', '"velocity"'))
		++count
	})
	assert(count === 1)

	// Test iterator usage
	count = 0
	let results = world.each('position', '"velocity"')
	for (let ent of results) {
		++count
	}
	assert(count === 1)

	// Passing callbacks cause the return value to be undefined
	results = world.each('position', () => {})
	assert(results === undefined)
	results = world.each(() => {})
	assert(results === undefined)

	// Test breaking out of the loop
	count = 0
	world.each('position', function({position}, ent) {
		assert(position)
		assert(ent)
		assert(ent.has('position'))
		++count
		return false
	})
	assert(count === 1)

	// And just to be sure there are more than 1
	count = world.get('position').length
	assert(count === 2)

	// Invalid args
	expect(() => {
		world.each('position', () => {}, 999)
	}).toThrow()
}))

test('system: test indexing with every()', testIndexers(world => {
	world.component('position', function(entity, val = 0) {
		this.val = val
	})
	world.component('velocity')
	world.component('sprite')
	let ent1 = world.entity().set('position', 1).set('velocity')
	let ent2 = world.entity().set('position', 10)
	let ent3 = world.entity().set('position', 100).set('velocity').set('sprite')
	let count = 0
	world.each('position', 'velocity', ({position: pos, velocity: vel}, ent) => {
		assert(ent.has('position', 'velocity'))
		count += pos.val
	})
	assert(count == 101)
	count = 0

	ent1.remove('position')
	ent1.set('sprite')
	ent2.set('velocity')
	world.each('position', 'velocity', ({position: pos, velocity: vel}, ent) => {
		assert(ent.has('position', 'velocity'))
		count += pos.val
	})
	assert(count == 110)

	ent1.remove('sprite')
	ent2.remove('sprite')
	ent3.remove('sprite')

	// Query for all entities
	let test = world.each()
	assert(getSize(test) == 3)

	let ent4 = world.entity()
	assert(getSize(world.each()) == 4)
	assert(has(world.each(), ent4))

	ent4.set('velocity')
	assert(getSize(world.each()) == 4)
	assert(has(world.each(), ent4))

	ent4.remove('velocity')
	assert(getSize(world.each()) == 4)
	assert(has(world.each(), ent4))

	ent4.destroy()
	assert(getSize(world.each()) == 3)
	assert(!has(world.each(), ent4))

	count = 0
	world.each(ent => {
		++count
	})
	assert(count == 3)

	count = 0
	world.system(class {
		run() {
			world.each(() => { ++count })
		}
	})
	world.run()
	expect(count).toEqual(3)
}))
