import { World } from '../index.js'

test('entity: create an entity', () => {
  const world = new World()
  let ent = world.entity()
  expect(world.entities.entities.size === 1).toBe(true)
  expect(typeof ent.id === 'number' && ent.id === 1).toBe(true)
})

test('entity: test if ID is read-only', () => {
  const world = new World()
  let ent = world.entity()
  expect(() => (ent.id = 5)).toThrow()
  expect(typeof ent.id === 'number' && ent.id === 1).toBe(true)
})

test('entity: valid entities', () => {
  const world = new World()
  let entityA = world.entity().set('test')
  let entityB = world.each('test')[0]
  expect(entityA.valid()).toBe(true)
  expect(entityB.valid()).toBe(true)
  expect(entityA.id === entityB.id).toBe(true)
  expect(entityA === entityB).toBe(true)

  entityA.destroy()
  expect(!entityA.valid()).toBe(true)
  expect(!entityB.valid()).toBe(true)
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
  expect(Object.keys(world.entities.componentClasses).length == 1).toBe(true)
  expect(ent.has('position')).toBe(true)
  expect(ent.get('position').val === 100).toBe(true)
  expect(ent.valid()).toBe(true)

  ent.destroy()

  expect(world.entities.entities.size == 0).toBe(true)
  expect(Object.keys(world.entities.componentClasses).length == 1).toBe(true)
  expect(!ent.valid()).toBe(true)
  expect(!ent.has('position')).toBe(true)

  // Just for safe measure
  ent.destroy()

  expect(world.entities.entities.size == 0).toBe(true)
  expect(Object.keys(world.entities.componentClasses).length == 1).toBe(true)
  expect(!ent.valid()).toBe(true)
  expect(!ent.has('position')).toBe(true)
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
  expect(ent.has('position')).toBe(true)
  expect(ent.components.length == 1).toBe(true)
  expect(ent.get('position').x === 5).toBe(true)
  expect(ent.get('position').y === 0).toBe(true)

  Object.assign(ent.access('position', {}), { y: 3 })
  expect(ent.has('position')).toBe(true)
  expect(ent.components.length == 1).toBe(true)
  expect(ent.get('position').x === 5).toBe(true)
  expect(ent.get('position').y === 3).toBe(true)

  Object.assign(ent.access('object', {}), { val: 50 })
  expect(ent.has('object')).toBe(true)
  expect(ent.components.length == 2).toBe(true)
  expect(ent.get('object').val === 50).toBe(true)

  Object.assign(ent.access('empty', {}), { testing: 100 })
  expect(ent.has('empty')).toBe(true)
  expect(ent.components.length == 3).toBe(true)
  expect(ent.get('empty').testing === 100).toBe(true)

  ent.set('anonymous')
  expect(ent.components.length == 4).toBe(true)
  expect(ent.has('anonymous')).toBe(true)

  // Access test
  ent.destroy()
  ent = world.entity()
  expect(!ent.has('position')).toBe(true)
  ent.access('position').x = 300
  expect(ent.has('position')).toBe(true)
  expect(ent.get('position').x === 300).toBe(true)

  // Get test
  ent.remove('position')
  expect(!ent.has('position')).toBe(true)
  expect(ent.get('position') === undefined).toBe(true)
  expect(!ent.has('position')).toBe(true)
  ent.set('position', 333)
  expect(ent.get('position').x === 333).toBe(true)
  expect(ent.get('position').y === 0).toBe(true)

  // Undefined component tests
  ent.remove('position')
  ent.set('invalid', { a: 'test' })
  expect(ent.get('invalid').a === 'test').toBe(true)

  ent.set('invalid', { b: 'test2' })
  expect(ent.get('invalid').a === undefined).toBe(true)
  expect(ent.get('invalid').b === 'test2').toBe(true)

  ent.set('invalid2', 5)
  expect(ent.get('invalid2') === 5).toBe(true)

  ent.set('invalid2', 'test')
  expect(ent.get('invalid2') === 'test').toBe(true)

  ent.set('invalid2', ['test'])
  expect(ent.get('invalid2')[0] === 'test').toBe(true)
})

test('entity: check existence of components', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })
  const ent = world.entity()
  expect(ent.has()).toBe(false)
  ent.set('a')
  ent.set('b')
  expect(ent.has()).toBe(false)
  expect(ent.has('a')).toBe(true)
  expect(ent.has('b')).toBe(true)
  expect(ent.has('a', 'does not matter what goes here')).toBe(true)
  expect(ent.has('c')).toBe(false)

  ent.destroy()
  expect(ent.has()).toBe(false)
  expect(ent.has('a')).toBe(false)
  expect(ent.has('b')).toBe(false)
  expect(ent.has('c')).toBe(false)
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
  expect(ent.components.length == 2).toBe(true)
  expect(ent.has('position')).toBe(true)
  expect(ent.has('velocity')).toBe(true)

  ent.remove('invalid')
  ent.remove()

  ent.remove('position')
  expect(ent.components.length == 1).toBe(true)
  expect(!ent.has('position')).toBe(true)
  expect(ent.has('velocity')).toBe(true)

  ent.remove('velocity')
  expect(ent.components.length == 0).toBe(true)
  expect(!ent.has('position')).toBe(true)
  expect(!ent.has('velocity')).toBe(true)

  ent.set('position').set('velocity')
  expect(ent.components.length == 2).toBe(true)
  expect(ent.has('position')).toBe(true)
  expect(ent.has('velocity')).toBe(true)
  ent.destroy()
  ent = world.entity()
  expect(ent.components.length == 0).toBe(true)
  expect(!ent.has('position')).toBe(true)
  expect(!ent.has('velocity')).toBe(true)

  // Remove many components
  ent.set('position').set('velocity').set('testA').set('testB')
  expect(ent.components.length == 4).toBe(true)
  expect(ent.has('position')).toBe(true)
  expect(ent.has('velocity')).toBe(true)
  expect(ent.has('testA')).toBe(true)
  expect(ent.has('testB')).toBe(true)
  ent.remove('invalidA', 'position', 'testA', 'invalidB')
  expect(!ent.has('position')).toBe(true)
  expect(ent.has('velocity')).toBe(true)
  expect(!ent.has('testA')).toBe(true)
  expect(ent.has('testB')).toBe(true)
  ent.remove('velocity', 'testB')
  expect(!ent.has('position')).toBe(true)
  expect(!ent.has('velocity')).toBe(true)
  expect(!ent.has('testA')).toBe(true)
  expect(!ent.has('testB')).toBe(true)
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
  expect(ent.has('test')).toBe(true)
  expect(obj.created).toBe(true)
  expect(!obj.removed).toBe(true)

  ent.remove('test')
  expect(ent.components.length == 0).toBe(true)
  expect(!ent.has('test')).toBe(true)
  expect(obj.created).toBe(true)
  expect(obj.removed).toBe(true)

  let obj2 = {
    created: false,
    removed: false,
  }
  let ent2 = world.entity().set('test', obj2)
  expect(ent2.has('test')).toBe(true)
  expect(obj2.created).toBe(true)
  expect(!obj2.removed).toBe(true)

  ent2.destroy()
  expect(obj2.created).toBe(true)
  expect(obj2.removed).toBe(true)
})

test('entity: serialize unregistered components', () => {
  const world = new World()
  let ent = world.entity().set('position', { x: 4, y: 6 })

  let data = JSON.parse(ent.toJSON())
  expect(data).toBeDefined()
  expect(data.position).toBeDefined()
  expect(data.position.x === 4).toBe(true)
  expect(data.position.y === 6).toBe(true)
})

test('entity: serialize registered components', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y

    this.toJSON = () => ({ result: this.x * this.y })
  })
  let ent = world.entity().set('position', 4, 6)

  let data = JSON.parse(ent.toJSON())
  expect(data).toBeDefined()
  expect(data.position).toBeDefined()
  expect(data.position.result === 24).toBe(true)
})

test('entity: deserialize unregistered components', () => {
  const world = new World()
  let ent = world.entity()
  expect(ent.components.length == 0).toBe(true)

  ent.fromJSON('{"position": {"x": 4, "y": 6}}')
  expect(ent.has('position')).toBe(true)
  expect(ent.components.length == 1).toBe(true)
  expect(ent.get('position')).toEqual({ x: 4, y: 6 })
  expect(ent.get('position').x === 4).toBe(true)
  expect(ent.get('position').y === 6).toBe(true)
})

test('entity: deserialize registered components', () => {
  class position {
    onCreate(x = 0, y = 0) {
      this.x = x
      this.y = y
    }

    toJSON() {
      return { result: this.x * this.y }
    }

    fromJSON({ result }) {
      this.x = result / 2
      this.y = 2
    }
  }
  const world = new World({ components: { position } })
  const baseline = world.entity().set('position')
  expect(baseline.get('position').x).toBe(0)
  expect(baseline.get('position').y).toBe(0)

  // Old deserialization test
  let ent = world.entity()
  expect(ent.components).toHaveLength(0)
  ent.fromJSON('{"position": {"result": 24}}')
  expect(ent.has('position')).toBe(true)
  expect(ent.components).toHaveLength(1)
  expect(ent.get('position').x).toBe(12)
  expect(ent.get('position').y).toBe(2)

  // Full entity-based serialization/deserialization test
  let ent2 = world.entity().set('position', 7, 4)
  let jsonData = ent2.toJSON()
  let ent3 = world.entity().fromJSON(jsonData)
  expect(ent3.has('position')).toBe(true)
  expect(ent3.get('position').x).toBe(14)
  expect(ent3.get('position').y).toBe(2)
  ent2.fromJSON(jsonData)
  expect(ent2.has('position')).toBe(true)
  expect(ent2.get('position').x).toBe(14)
  expect(ent2.get('position').y).toBe(2)
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
  expect(
    ent.has('position') &&
      ent.has('velocity') &&
      ent.has('player') &&
      ent.has('anonymous')
  ).toBe(true)
  expect(ent.has('invalid')).toBe(false)
  expect(ent.has()).toBe(false)
  let ent2 = world.entity()
  expect(ent2.has()).toBe(false)
  expect(ent2.has('invalid')).toBe(false)
})

test('entity: cloning basic', () => {
  const world = new World()
  const source = world.entity().set('a', 'aaa')
  const target = world.entity()
  source._cloneComponentTo(target, 'a')
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
  source._cloneComponentTo(target, 'foo')
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
