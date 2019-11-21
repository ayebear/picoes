const {
    testIndexers,
    assert
} = require('./test_utils.js')

test('entity: create an entity', testIndexers(world => {
	world.component('position')
	let ent = world.entity()
	assert(world.entities.size == 1)
	assert(ent.toString() == String(ent.id))
}))

test('entity: test if ID is read-only', testIndexers(world => {
	let ent = world.entity()
	expect(() => ent.id = 5).toThrow()
	assert(typeof ent.id === 'number' && ent.id === 1)
}))

test('entity: valid entities', testIndexers(world => {
	let entityA = world.entity().set('test')
	let entityB = world.get('test')[0]
	assert(entityA.valid())
	assert(entityB.valid())
	assert(entityA.id === entityB.id)
	assert(entityA === entityB)

	entityA.destroy()
	assert(!entityA.valid())
	assert(!entityB.valid())
}))

test('entity: remove an entity', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	})
	let ent = world.entity()
	ent.set('position')
	ent.get('position').val = 100

	assert(world.entities.size == 1)
	assert(Object.keys(world.components).length == 1)
	assert(ent.has('position'))
	assert(ent.get('position').val === 100)
	assert(ent.valid())

	ent.destroy()

	assert(world.entities.size == 0)
	assert(Object.keys(world.components).length == 1)
	assert(!ent.valid())
	assert(!ent.has('position'))

	// Just for safe measure
	ent.destroy()

	assert(world.entities.size == 0)
	assert(Object.keys(world.components).length == 1)
	assert(!ent.valid())
	assert(!ent.has('position'))
}))

test('entity: get and set components', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	})
	world.component('empty')
	let ent = world.entity()
	ent.set('position', 5)
	assert(ent.has('position'))
	assert(ent.components.length == 1)
	assert(ent.get('position').x === 5)
	assert(ent.get('position').y === 0)

	ent.update('position', {y: 3})
	assert(ent.has('position'))
	assert(ent.components.length == 1)
	assert(ent.get('position').x === 5)
	assert(ent.get('position').y === 3)

	ent.update('object', {val: 50})
	assert(ent.has('object'))
	assert(ent.components.length == 2)
	assert(ent.get('object').val === 50)

	ent.update('empty', {testing: 100})
	assert(ent.has('empty'))
	assert(ent.components.length == 3)
	assert(ent.get('empty').testing === 100)

	ent.set('anonymous')
	assert(ent.components.length == 4)
	assert(ent.has('anonymous'))

	// Access test
	ent.removeAll()
	assert(!ent.has('position'))
	ent.access('position').x = 300
	assert(ent.has('position'))
	assert(ent.get('position').x === 300)

	// Get test
	ent.removeAll()
	assert(!ent.has('position'))
	assert(ent.get('position') === undefined)
	assert(!ent.has('position'))
	ent.set('position', 333)
	assert(ent.get('position').x === 333)
	assert(ent.get('position').y === 0)

	// Undefined component tests
	ent.removeAll()
	ent.set('invalid', {a: 'test'})
	assert(ent.get('invalid').a === 'test')

	ent.set('invalid', {b: 'test2'})
	assert(ent.get('invalid').a === undefined)
	assert(ent.get('invalid').b === 'test2')

	ent.set('invalid2', 5)
	assert(ent.get('invalid2') === 5)

	ent.set('invalid2', 'test')
	assert(ent.get('invalid2') === 'test')

	ent.set('invalid2', ['test'])
	assert(ent.get('invalid2')[0] === 'test')
}))

test('entity: setRaw', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	})
	let ent = world.entity()
	ent.set('position', 10, 20)
	assert(ent.has('position'))
	assert(ent.get('position').x === 10)
	assert(ent.get('position').y === 20)
	
	// Set raw tests
	const previous = ent.get('position')
	ent.remove('position')
	assert(!ent.has('position'))
	
	ent.setRaw('position', previous)
	
	assert(ent.has('position'))
	assert(ent.get('position').x === 10)
	assert(ent.get('position').y === 20)
	
	// Invalid entity
	ent.remove('position')
	ent.detach()
	ent.setRaw('position', previous)
	assert(ent.has('position'))
	assert(ent.get('position').x === 10)
	assert(ent.get('position').y === 20)
}))

test('entity: remove components', testIndexers(world => {
	world.component('position')
	world.component('velocity')
	let ent = world.entity().set('position').set('velocity')
	assert(ent.components.length == 2)
	assert(ent.has('position'))
	assert(ent.has('velocity'))

	ent.remove('invalid')
	ent.remove()

	ent.remove('position')
	assert(ent.components.length == 1)
	assert(!ent.has('position'))
	assert(ent.has('velocity'))

	ent.remove('velocity')
	assert(ent.components.length == 0)
	assert(!ent.has('position'))
	assert(!ent.has('velocity'))

	ent.set('position').set('velocity')
	assert(ent.components.length == 2)
	assert(ent.has('position'))
	assert(ent.has('velocity'))
	ent.removeAll()
	assert(ent.components.length == 0)
	assert(!ent.has('position'))
	assert(!ent.has('velocity'))

	// Remove many components
	ent.set('position').set('velocity').set('testA').set('testB')
	assert(ent.components.length == 4)
	assert(ent.has('position'))
	assert(ent.has('velocity'))
	assert(ent.has('testA'))
	assert(ent.has('testB'))
	ent.remove('invalidA', 'position', 'testA', 'invalidB')
	assert(!ent.has('position'))
	assert(ent.has('velocity'))
	assert(!ent.has('testA'))
	assert(ent.has('testB'))
	ent.remove('velocity', 'testB')
	assert(!ent.has('position'))
	assert(!ent.has('velocity'))
	assert(!ent.has('testA'))
	assert(!ent.has('testB'))
}))

test('entity: remove components - onRemove', testIndexers(world => {
	world.component('test', function(entity, obj) {
		this.obj = obj
		this.obj.created = true

		this.onRemove = testIndexers(world => {
			this.obj.removed = true
		})

	})
	let obj = {
		created: false,
		removed: false
	}
	let ent = world.entity().set('test', obj)
	assert(ent.has('test'))
	assert(obj.created)
	assert(!obj.removed)

	ent.remove('test')
	assert(ent.components.length == 0)
	assert(!ent.has('test'))
	assert(obj.created)
	assert(obj.removed)


	let obj2 = {
		created: false,
		removed: false
	}
	let ent2 = world.entity().set('test', obj2)
	assert(ent2.has('test'))
	assert(obj2.created)
	assert(!obj2.removed)

	ent2.destroy()
	assert(obj2.created)
	assert(obj2.removed)
}))

test('entity: serialize components', testIndexers(world => {
	world.component('position')
	let ent = world.entity().update('position', {x: 4, y: 6})

	let data = JSON.parse(ent.toJSON())
	assert(data)
	assert(data.position)
	assert(data.position.x === 4)
	assert(data.position.y === 6)
}))

test('entity: serialize custom components', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y

		this.toJSON = () => ({ result: this.x * this.y })

	})
	let ent = world.entity().set('position', 4, 6)

	let data = JSON.parse(ent.toJSON())
	assert(data)
	assert(data.position)
	assert(data.position.result === 24)
}))

test('entity: deserialize components', testIndexers(world => {
	world.component('position')
	let ent = world.entity()
	assert(ent.components.length == 0)

	ent.fromJSON('{"position": {"x": 4, "y": 6}}')
	assert(ent.has('position'))
	assert(ent.components.length == 1)
	assert(ent.get('position'))
	assert(ent.get('position').x === 4)
	assert(ent.get('position').y === 6)
}))

test('entity: deserialize custom components', testIndexers(world => {
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y

		this.toJSON = () => ({ result: this.x * this.y })

		this.fromJSON = (data) => {
			this.x = data.result / 2
			this.y = 2
		}
	})

	// Old deserialization test
	let ent = world.entity()
	assert(ent.components.length == 0)
	ent.fromJSON('{"position": {"result": 24}}')
	assert(ent.has('position'))
	assert(ent.components.length == 1)
	assert(ent.get('position'))
	assert(ent.get('position').x === 12)
	assert(ent.get('position').y === 2)

	// Full entity-based serialization/deserialization test
	let ent2 = world.entity().set('position', 7, 4)
	let jsonData = ent2.toJSON()
	let ent3 = world.entity().fromJSON(jsonData)
	assert(ent3.has('position'))
	assert(ent3.get('position').x === 14)
	assert(ent3.get('position').y === 2)
	ent2.fromJSON(jsonData)
	assert(ent2.has('position'))
	assert(ent2.get('position').x === 14)
	assert(ent2.get('position').y === 2)
}))

test('entity: check for existence of components', testIndexers(world => {
	// Test all component types
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	})
	world.component('velocity')
	world.component('player')

	let ent = world.entity()
		.set('position', 1, 2)
		.set('velocity', {x: 3, y: 4})
		.set('player')
		.set('anonymous')

	// Check for existence
	assert(ent.has('position') && ent.has('velocity') && ent.has('player') && ent.has('anonymous'))
	assert(ent.has('position', 'velocity', 'player', 'anonymous'))
	assert(!ent.has('position', 'invalid'))
	assert(!ent.has('velocity', 'invalid'))
	assert(!ent.has('player', 'invalid'))
	assert(!ent.has('anonymous', 'invalid'))
	assert(!ent.has('invalid'))

	// This behavior is important for every/systems to work properly when no components are specified
	// Basically, it should return all entities when nothing is specified
	assert(ent.has())
	let ent2 = world.entity()
	assert(ent2.has())
	assert(!ent2.has('invalid'))
}))

test('entity: register and use prototypes', testIndexers(world => {
	// Test all three component types
	world.component('position', function(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	})

	let result = world.prototype()
	assert(result == 0)

	// Register prototypes in all ways
	result = world.prototype({Player: {
		position: {
			x: 5,
			y: 10
		},
		velocity: {
			x: 15,
			y: 20
		},
		player: {}
	}, Enemy: {
		position: {},
		velocity: {}
	}})
	assert(result == 2)

	let stringTest = JSON.stringify({Test: {
		position: {
			x: 3.14159,
			y: 5000
		}
	}})
	result = world.prototype(stringTest)
	assert(result == 1)

	// Create entities with the prototype
	let p = world.entity('Player')
	let e = world.entity('Enemy')
	let t = world.entity('Test')

	// Make sure all components exist and there are no extras
	assert(p.has('position', 'velocity', 'player'))
	assert(e.has('position', 'velocity') && !e.has('player'))
	assert(t.has('position') && !t.has('velocity') && !t.has('player'))

	// Make sure all component values are correct
	assert(p.get('position').x === 5 && p.get('position').y === 10)
	assert(p.get('velocity').x === 15 && p.get('velocity').y === 20)
	assert(p.get('player') !== undefined)
	assert(e.get('position').x === 0 && e.get('position').y === 0)
	assert(e.get('velocity').x === undefined && e.get('velocity').y === undefined)
	assert(t.get('position').x === 3.14159 && t.get('position').y === 5000)
}))
