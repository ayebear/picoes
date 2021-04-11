import { World } from '../index.js'
import { assert } from './test_utils.js'

test('entity: create an entity', () => {
  const world = new World()
  let ent = world.entity()
  assert(world.entities.entities.size === 1)
  assert(typeof ent.id === 'number' && ent.id === 1)
})

test('entity: test if ID is read-only', () => {
  const world = new World()
  let ent = world.entity()
  expect(() => (ent.id = 5)).toThrow()
  assert(typeof ent.id === 'number' && ent.id === 1)
})

test('entity: valid entities', () => {
  const world = new World()
  let entityA = world.entity().set('test')
  let entityB = world.each('test')[0]
  assert(entityA.valid())
  assert(entityB.valid())
  assert(entityA.id === entityB.id)
  assert(entityA === entityB)

  entityA.destroy()
  assert(!entityA.valid())
  assert(!entityB.valid())
})

test('entity: remove an entity', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })
  let ent = world.entity()
  ent.set('position')
  ent.get('position').val = 100

  expect(world.entities.entities.size).toBe(1)
  assert(Object.keys(world.entities.componentClasses).length == 1)
  assert(ent.has('position'))
  assert(ent.get('position').val === 100)
  assert(ent.valid())

  ent.destroy()

  assert(world.entities.entities.size == 0)
  assert(Object.keys(world.entities.componentClasses).length == 1)
  assert(!ent.valid())
  assert(!ent.has('position'))

  // Just for safe measure
  ent.destroy()

  assert(world.entities.entities.size == 0)
  assert(Object.keys(world.entities.componentClasses).length == 1)
  assert(!ent.valid())
  assert(!ent.has('position'))
})

test('entity: get and set components', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })
  expect(() => {
    world.component('empty')
  }).toThrow()
  let ent = world.entity()
  ent.set('position', 5)
  assert(ent.has('position'))
  assert(ent.hasAny('position'))
  assert(ent.components.length == 1)
  assert(ent.get('position').x === 5)
  assert(ent.get('position').y === 0)

  Object.assign(ent.access('position', {}), { y: 3 })
  assert(ent.has('position'))
  assert(ent.hasAny('position'))
  assert(ent.components.length == 1)
  assert(ent.get('position').x === 5)
  assert(ent.get('position').y === 3)

  Object.assign(ent.access('object', {}), { val: 50 })
  assert(ent.has('object'))
  assert(ent.hasAny('object'))
  assert(ent.components.length == 2)
  assert(ent.get('object').val === 50)

  Object.assign(ent.access('empty', {}), { testing: 100 })
  assert(ent.has('empty'))
  assert(ent.hasAny('empty'))
  assert(ent.components.length == 3)
  assert(ent.get('empty').testing === 100)

  ent.set('anonymous')
  assert(ent.components.length == 4)
  assert(ent.has('anonymous'))
  assert(ent.hasAny('anonymous'))

  // Access test
  ent.removeAll()
  assert(!ent.has('position'))
  assert(!ent.hasAny('position'))
  ent.access('position').x = 300
  assert(ent.has('position'))
  assert(ent.hasAny('position'))
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
  ent.set('invalid', { a: 'test' })
  assert(ent.get('invalid').a === 'test')

  ent.set('invalid', { b: 'test2' })
  assert(ent.get('invalid').a === undefined)
  assert(ent.get('invalid').b === 'test2')

  ent.set('invalid2', 5)
  assert(ent.get('invalid2') === 5)

  ent.set('invalid2', 'test')
  assert(ent.get('invalid2') === 'test')

  ent.set('invalid2', ['test'])
  assert(ent.get('invalid2')[0] === 'test')
})

test('entity: check existence of components', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })
  const ent = world.entity()
  assert(!ent.hasAny())
  assert(ent.has())
  ent.set('a')
  ent.set('b')
  assert(ent.has())
  assert(ent.has('a'))
  assert(ent.has('a', 'b'))
  assert(!ent.has('a', 'b', 'c', 'd'))
  assert(!ent.hasAny())
  assert(ent.hasAny('a'))
  assert(ent.hasAny('a', 'b'))
  assert(ent.hasAny('', 'a', 'c'))
  assert(ent.hasAny('a', 'b', 'c', 'd'))

  ent.removeAll()
  assert(ent.has())
  assert(!ent.has('a'))
  assert(!ent.has('a', 'b'))
  assert(!ent.has('a', 'b', 'c', 'd'))
  assert(!ent.hasAny())
  assert(!ent.hasAny('a'))
  assert(!ent.hasAny('a', 'b'))
  assert(!ent.hasAny('', 'a', 'c'))
  assert(!ent.hasAny('a', 'b', 'c', 'd'))
})

test('entity: replace', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })
  const ent = world
    .entity()
    .set('position', 10, 20)
    .set('existing', { foo: 'bar' })
  expect(ent.has('position')).toBe(true)
  expect(ent.get('position').x).toBe(10)
  expect(ent.get('position').y).toBe(20)
  expect(ent.has('existing')).toBe(true)
  expect(ent.get('existing').foo).toBe('bar')

  // replace() registered
  const previous = ent.get('position')
  ent.remove('position')
  expect(ent.has('position')).toBe(false)
  ent.replace('position', previous, true)
  expect(ent.has('position')).toBe(true)
  expect(ent.get('position').x).toBe(10)
  expect(ent.get('position').y).toBe(20)

  // Replace with detached entity
  ent.remove('position')
  ent.detach()
  ent.replace('position', previous, true)
  expect(ent.has('position')).toBe(true)
  expect(ent.get('position').x).toBe(10)
  expect(ent.get('position').y).toBe(20)
  ent.attach(world)

  // replace() registered without flag
  ent.remove('position')
  expect(ent.has('position')).toBe(false)
  expect(() => {
    ent.replace('position', previous)
  }).toThrow()
  expect(ent.has('position')).toBe(false)

  // replace() unregistered
  expect(ent.get('existing').foo).toBe('bar')
  expect(ent.replace('existing', { a: 'b' })).toBe(ent)
  expect(ent.get('existing').foo).toBe(undefined)
  expect(ent.get('existing').a).toBe('b')

  // replace() unregistered new
  ent.replace('foo', 'bar')
  expect(ent.get('foo')).toBe('bar')
})

test('entity: remove components', () => {
  const world = new World()
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
})

test('entity: remove components - onRemove', () => {
  const world = new World()
  world.component('test', function (obj) {
    this.obj = obj
    this.obj.created = true

    this.onRemove = () => {
      this.obj.removed = true
    }
  })
  let obj = {
    created: false,
    removed: false,
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
    removed: false,
  }
  let ent2 = world.entity().set('test', obj2)
  assert(ent2.has('test'))
  assert(obj2.created)
  assert(!obj2.removed)

  ent2.destroy()
  assert(obj2.created)
  assert(obj2.removed)
})

test('entity: serialize components', () => {
  const world = new World()
  let ent = world.entity().set('position', { x: 4, y: 6 })

  let data = JSON.parse(ent.toJSON())
  assert(data)
  assert(data.position)
  assert(data.position.x === 4)
  assert(data.position.y === 6)
})

test('entity: serialize custom components', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y

    this.toJSON = () => ({ result: this.x * this.y })
  })
  let ent = world.entity().set('position', 4, 6)

  let data = JSON.parse(ent.toJSON())
  assert(data)
  assert(data.position)
  assert(data.position.result === 24)
})

test('entity: deserialize components', () => {
  const world = new World()
  let ent = world.entity()
  assert(ent.components.length == 0)

  ent.fromJSON('{"position": {"x": 4, "y": 6}}')
  assert(ent.has('position'))
  assert(ent.components.length == 1)
  assert(ent.get('position'))
  assert(ent.get('position').x === 4)
  assert(ent.get('position').y === 6)
})

test('entity: deserialize custom components', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y

    this.toJSON = () => ({ result: this.x * this.y })

    this.fromJSON = data => {
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
})

test('entity: check for existence of components', () => {
  const world = new World()
  // Test all component types
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })

  let ent = world
    .entity()
    .set('position', 1, 2)
    .set('velocity', { x: 3, y: 4 })
    .set('player')
    .set('anonymous')

  // Check for existence
  assert(
    ent.has('position') &&
      ent.has('velocity') &&
      ent.has('player') &&
      ent.has('anonymous')
  )
  assert(ent.has('position', 'velocity', 'player', 'anonymous'))
  assert(!ent.has('position', 'invalid'))
  assert(!ent.has('velocity', 'invalid'))
  assert(!ent.has('player', 'invalid'))
  assert(!ent.has('anonymous', 'invalid'))
  assert(!ent.has('invalid'))

  // This behavior is important for world.each to work properly when no components are specified
  // Basically, it should return all entities when nothing is specified
  assert(ent.has())
  let ent2 = world.entity()
  assert(ent2.has())
  assert(!ent2.has('invalid'))
})

test('entity: cloning basic', () => {
  const world = new World()
  const source = world.entity().set('a', 'aaa')
  const target = world.entity()
  source.cloneComponentTo(target, 'a')
  expect(target.get('a')).toEqual('aaa')
})

test('entity: cloning advanced', () => {
  const world = new World()
  world.component(
    'foo',
    class {
      onCreate(bar, baz) {
        this.bar = bar
        this.baz = baz
        this.qux = false
      }
      setQux(qux = true) {
        this.qux = qux
      }
      cloneArgs() {
        return [this.bar, this.baz]
      }
      clone(target) {
        target.qux = this.qux
      }
    }
  )
  const source = world.entity().set('foo', 'bar', 'baz').set('qux', true)
  const target = world.entity()
  source.cloneComponentTo(target, 'foo')
  expect(source.get('foo').bar).toEqual(target.get('foo').bar)
  expect(source.get('foo').baz).toEqual(target.get('foo').baz)
  expect(source.get('foo').qux).toEqual(target.get('foo').qux)

  const target2 = source.clone()
  expect(source.get('foo').bar).toEqual(target2.get('foo').bar)
  expect(source.get('foo').baz).toEqual(target2.get('foo').baz)
  expect(source.get('foo').qux).toEqual(target2.get('foo').qux)

  target.get('foo').bar = 'change1'
  target2.get('foo').baz = 'change2'
  expect(source.get('foo').bar).not.toEqual(target.get('foo').bar)
  expect(source.get('foo').baz).toEqual(target.get('foo').baz)
  expect(source.get('foo').qux).toEqual(target.get('foo').qux)
  expect(source.get('foo').bar).toEqual(target2.get('foo').bar)
  expect(source.get('foo').baz).not.toEqual(target2.get('foo').baz)
  expect(source.get('foo').qux).toEqual(target2.get('foo').qux)

  const target3 = target2.clone()
  expect(target3.get('foo').bar).toEqual(target2.get('foo').bar)
  expect(target3.get('foo').baz).toEqual(target2.get('foo').baz)
  expect(target3.get('foo').qux).toEqual(target2.get('foo').qux)

  target3.destroy()
  expect(() => target3.clone()).toThrow()
})
