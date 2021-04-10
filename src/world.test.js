import { World } from '../index.js'
import { Entity } from './entity.js'
import { getSize, has, assert } from './test_utils.js'

test('world: create a world', () => {
  const world = new World()
  assert(world instanceof World)
  assert(typeof world.component === 'function')
})

test('world: create a world with options', () => {
  // Define components
  class position {}
  class velocity {}
  // Define systems
  class input {}
  class physics {}
  class render {}
  // Define state
  const state = {}
  // Make worlds
  const world1 = new World({})
  expect(world1).toBeInstanceOf(World)
  expect(world1.systems.systems).toHaveLength(0)
  expect(getSize(world1.entities.componentClasses)).toBe(0)
  expect(getSize(world1.systems.context)).toBe(0)
  const world2 = new World({
    components: {},
    systems: [],
    context: {},
  })
  expect(world2).toBeInstanceOf(World)
  expect(world2.systems.systems).toHaveLength(0)
  expect(getSize(world2.entities.componentClasses)).toBe(0)
  expect(getSize(world2.systems.context)).toBe(0)
  const world3 = new World({
    components: { position, velocity },
    systems: [input, physics, render],
    context: { state },
  })
  expect(world3).toBeInstanceOf(World)
  expect(world3.systems.systems).toHaveLength(3)
  expect(getSize(world3.entities.componentClasses)).toBe(2)
  expect(getSize(world3.systems.context)).toBe(1)
})

test('component: define a component', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y

    this.inc = a => {
      return a + 1
    }
  })
  let ent = world.entity().set('position', 1, 2)
  assert('position' in world.entities.componentClasses)
  assert(Object.keys(world.entities.componentClasses).length == 1)
  assert(ent.has('position'))
  assert(ent.get('position').x === 1)
  assert(ent.get('position').y === 2)
  assert(ent.get('position').inc(5) === 6)

  // Using class syntax
  world.component(
    'velocity',
    class {
      constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
      }

      inc(a) {
        return a + 1
      }
    }
  )
  let ent2 = world.entity().set('velocity', 1, 2)
  assert('velocity' in world.entities.componentClasses)
  assert(Object.keys(world.entities.componentClasses).length == 2)
  assert(ent2.has('velocity'))
  assert(ent2.get('velocity').x === 1)
  assert(ent2.get('velocity').y === 2)
  assert(ent2.get('velocity').inc(5) === 6)

  // Should throw when calling "components" setter
  expect(() => (ent2.components = ['anything'])).toThrow()
})

test('component: README example', () => {
  const world = new World()
  // Create player
  let player = world.entity().set('health', { value: 100 })

  // Create enemies
  world.entity().set('damages', 10)
  world.entity().set('damages', 30)

  // Apply damage
  world.each('damages', ({ damages: amount }) => {
    player.get('health').value -= amount
  })

  // Player now has reduced health
  assert(player.get('health').value === 60)
})

test('component: define invalid components', () => {
  const world = new World()
  expect(() => {
    world.component('empty')
  }).toThrow()
  expect(() => {
    world.component('position', {
      x: 0,
      y: 0,
    })
  }).toThrow()
  expect(() => {
    world.component('invalid', 555)
  }).toThrow()
  assert(Object.keys(world.entities.componentClasses).length === 0)
})

test('component: use an empty component', () => {
  const world = new World()
  let ent = world.entity().set('position', {
    x: 1,
  })
  assert(ent.has('position'))
  assert(ent.get('position').x === 1)

  let ent2 = world.entity().set('velocity', {
    x: 2,
  })
  assert(ent2.has('velocity'))
  assert(ent2.get('velocity').x === 2)
  ent2.set('velocity', {
    y: 3,
  })
  assert(ent2.get('velocity').x === undefined)
  assert(ent2.get('velocity').y === 3)
  ent2.get('velocity').x = 42
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
})

test('component: test clearing with indexes', () => {
  const world = new World()
  world.component('position', function (x = 0, y = 0) {
    this.x = x
    this.y = y
  })
  let results = world.each()
  results = world.each('position')
  results = world.each('position', 'velocity')

  world.entity().set('position', 1, 2).set('velocity')
  world.entity().set('position', 3, 4).set('velocity')
  world.entity().set('position', 5, 6)
  world.entity().set('velocity')

  let count = 0
  world.each('position', ({ position }) => {
    assert(position.x >= 1)
    assert(position.y >= 2)
    ++count
  })
  assert(count === 3)

  world.clear()

  count = 0
  world.each('position', ({ position }) => {
    ++count
  })
  world.each((_, ent) => {
    ++count
  })
  assert(count === 0)
})

test('component: test entity creation with constructor parameters', () => {
  const world = new World()
  let when = 0
  world.component(
    'sprite',
    class {
      onCreate(texture, size, invalid) {
        this.texture = texture
        this.size = size
        this.constructorCalled = ++when
        assert(texture && texture === this.texture)
        assert(size && size === this.size)
        assert(invalid === undefined)

        // Regression in 0.3.0, fixed in 0.3.1
        assert(this.entity.get('sprite') === this)
      }
    }
  )

  let ent = world.entity().set('sprite', 'test.png', 100)
  assert(ent.get('sprite').constructorCalled === 1)
  assert(ent.get('sprite').entity === ent)
  assert(ent.get('sprite').texture === 'test.png')
  assert(ent.get('sprite').size === 100)
})

test('component: test clearing with onRemove', () => {
  const world = new World()
  let spriteCount = 0
  world.component(
    'sprite',
    class {
      constructor() {
        ++spriteCount
      }

      onRemove() {
        --spriteCount
      }
    }
  )

  let ent = world.entity().set('sprite')
  assert(spriteCount === 1)

  let ent2 = world.entity().set('sprite')
  assert(spriteCount === 2)

  world.clear()
  assert(spriteCount === 0)
})

test('component: test detach and attach', () => {
  const world = new World()
  let spriteCount = 0
  world.component(
    'sprite',
    class {
      constructor() {
        ++spriteCount
      }

      onRemove() {
        --spriteCount
      }
    }
  )

  let ent = world.entity().set('sprite').set('position', { x: 1 })
  assert(spriteCount === 1)

  let ent2 = world.entity().set('sprite').set('position', { x: 2 })
  assert(spriteCount === 2)

  // Test detaching
  assert(ent.valid())
  ent.detach()
  assert(!ent.valid())
  assert(spriteCount === 2)
  assert(world.entities.entities.size === 1)
  assert(getSize(world.each('position')) === 1)
  assert(world.each('position').length === 1)
  assert(world.each('position')[0].get('position').x === 2)
  assert(ent.get('position').x === 1)

  // Test attaching
  ent.attach(world)
  assert(ent.valid())
  assert(spriteCount === 2)
  assert(world.entities.entities.size === 2)
  assert(getSize(world.each('position')) === 2)
  assert(world.each('position').length === 2)
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
})

test('component: test detached entities', () => {
  const world = new World()
  let ent = world
    .entity()
    .set('sprite', { texture: 'image.png' })
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

  ent.set('velocity', { x: 10 })
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
  ent2.set('velocity', { x: 30 })
  ent2.set('position', 7)
  assert(ent2.has('velocity', 'position'))
  assert(ent2.get('velocity').x === 30)
  assert(ent2.get('position') === 7)
  ent2.removeAll()
  assert(!ent2.has('velocity'))
  assert(!ent2.has('position'))
})

test('system: define a system', () => {
  const world = new World()
  world.system(class {})
  assert(world.systems.systems.length == 1)
})

test('system: define a system with arguments', () => {
  const world = new World()
  let velocitySystem = class {
    constructor(maxVelocity, canvas, textures) {
      this.maxVelocity = maxVelocity
      this.canvas = canvas
      this.textures = textures
    }
  }
  world.system(velocitySystem, 3500, 'someCanvas', ['textures.png'])
  assert(world.systems.systems[0].maxVelocity === 3500)
  assert(world.systems.systems[0].canvas === 'someCanvas')
  assert(world.systems.systems[0].textures[0] === 'textures.png')
})

test('system: define a system with context (no key)', () => {
  const world = new World()
  const state = {
    maxVelocity: 3500,
    canvas: 'someCanvas',
    textures: ['textures.png'],
  }
  const ran = []
  const velocitySystem = class {
    init(existing) {
      this.existing = existing
      if (!existing) {
        expect(this.maxVelocity).toEqual(3500)
        expect(this.canvas).toEqual('someCanvas')
        expect(this.textures[0]).toEqual('textures.png')
        ran.push(existing)
      }
    }
    run() {
      expect(this.maxVelocity).toEqual(3500)
      expect(this.canvas).toEqual('someCanvas')
      expect(this.textures[0]).toEqual('textures.png')
      ran.push(this.existing)
    }
  }
  world.system(velocitySystem, true) // Existing system
  world.context(state) // Set keyless context
  world.system(velocitySystem, false) // New system
  expect(world.systems.systems.length).toEqual(2)
  world.run()
  expect(ran).toEqual([false, true, false])
})

test('system: define a system with context (specific key)', () => {
  const world = new World()
  const state = {
    maxVelocity: 3500,
    canvas: 'someCanvas',
    textures: ['textures.png'],
  }
  const ran = []
  const velocitySystem = class {
    init(existing) {
      this.existing = existing
      if (!existing) {
        expect(this.state.maxVelocity).toEqual(3500)
        expect(this.state.canvas).toEqual('someCanvas')
        expect(this.state.textures[0]).toEqual('textures.png')
        ran.push(existing)
      }
    }
    run() {
      expect(this.state.maxVelocity).toEqual(3500)
      expect(this.state.canvas).toEqual('someCanvas')
      expect(this.state.textures[0]).toEqual('textures.png')
      ran.push(this.existing)
    }
  }
  world.system(velocitySystem, true) // Existing system
  world.context({ state }) // Set keyed context
  world.system(velocitySystem, false) // New system
  expect(world.systems.systems.length).toEqual(2)
  world.run()
  expect(ran).toEqual([false, true, false])
})

test('system: system iteration', () => {
  const world = new World()
  world.system(
    class {
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
    }
  )

  let dt = 0.1667
  let total = dt

  let entA = world.entity()
  let entB = world.entity()
  let entC = world.entity()
  Object.assign(entA.access('position', {}), { x: 1, y: 1 })
  Object.assign(entA.access('velocity', {}), { x: 1, y: 0 })
  Object.assign(entB.access('position', {}), { x: 30, y: 40 })
  Object.assign(entB.access('velocity', {}), { x: -1, y: 2 })

  assert(entA.get('position').x == 1 && entA.get('position').y == 1)
  assert(entB.get('position').x == 30 && entB.get('position').y == 40)

  world.run(dt, total)

  assert(entA.get('position').x == 2 && entA.get('position').y == 1)
  assert(entB.get('position').x == 29 && entB.get('position').y == 42)

  total += dt
  world.run(dt, total)

  assert(entA.get('position').x == 3 && entA.get('position').y == 1)
  assert(entB.get('position').x == 28 && entB.get('position').y == 44)
})

test('system: system methods', () => {
  const world = new World()
  let methodsCalled = 0

  world.system(
    class {
      constructor() {
        this.val = 10
        ++methodsCalled
      }
      init() {
        ++methodsCalled
      }
      run() {
        ++methodsCalled
        assert(this.val === 10)
        world.each('position', ({ position }) => {
          position.x = 1
          ++methodsCalled
          assert(this.val === 10)
        })
      }
    }
  )

  world.system(class {})
  expect(() => {
    world.system()
  }).toThrow()

  world.entity().set('position', {})
  assert(methodsCalled == 2)
  world.run()
  assert(methodsCalled == 4)
})

test('system: system edge cases', () => {
  const world = new World()
  world.component('position', class {})
  world.component('velocity', class {})

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

  world.system(
    class {
      run() {
        world.each(['position', 'velocity'], ({ position, velocity }, ent) => {
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
    }
  )
  let entA = world.entity()
  let entB = world.entity()
  let entC = world.entity()
  Object.assign(entA.access('position', {}), { x: 1, y: 1 })
  Object.assign(entA.access('velocity', {}), { x: 1, y: 0 })
  Object.assign(entB.access('position', {}), { x: 30, y: 40 })
  Object.assign(entB.access('velocity', {}), { x: -1, y: 2 })

  assert(entA.get('position').x == 1 && entA.get('position').y == 1)
  assert(entB.get('position').x == 30 && entB.get('position').y == 40)

  world.run()

  assert(entA.get('position').x == 2 && entA.get('position').y == 1)
  assert(entB.get('position').x == 29 && entB.get('position').y == 42)

  world.run()

  assert(entA.get('position').x == 3 && entA.get('position').y == 1)
  assert(entB.get('position').x == 28 && entB.get('position').y == 44)
})

test('system: adding entities to index', () => {
  const world = new World()
  world.entity().set('a').set('b')
  expect(world.each('a', 'b').length).toBe(1)
  world.each('a', 'b')[0].destroy()
  expect(world.each('a', 'b').length).toBe(0)
  world.entity().set('a')
  expect(world.each('a', 'b').length).toBe(0)
  world.entity().set('b')
  expect(world.each('a', 'b').length).toBe(0)
  world.entity().set('b').set('a')
  expect(world.each('a', 'b').length).toBe(1)
})

test('system: onRemove edge cases', () => {
  const world = new World()
  world.component(
    'position',
    class {
      onCreate(value) {
        this.value = value
      }

      onRemove() {
        this.entity.set('somethingElse')
      }
    }
  )

  let entity = world.entity().set('position')

  expect(() => entity.destroy()).toThrow()
})

test('system: indexing edge cases', () => {
  const world = new World()
  // This test was to discover the "adding entities to index" and "onRemove edge cases" tests above
  // Keeping it in case there are other problems in the future

  let g = { count: 0 }

  // Define components
  world.component(
    'position',
    class {
      onCreate(x = 0, y = 0) {
        this.x = x
        this.y = y
      }
    }
  )
  world.component(
    'velocity',
    class {
      onCreate(x = 0, y = 0) {
        this.x = x
        this.y = y
      }
    }
  )
  world.component(
    'sprite',
    class {
      onCreate(texture) {
        this.texture = texture
      }

      onRemove() {
        g.entity.set('sideEffect', ++g.count)
      }
    }
  )

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
      assert(world.each('noOtherComponents').length === 1)
      assert(world.each('sideEffect').length === 0)
      assert(world.each('sprite').length === 4)
      assert(world.each('velocity').length === 4)
      assert(world.each().length === 8)
      assert(world.each('position').length === 4)
      assert(world.each('position', 'velocity').length === 2)
      assert(world.each('position', 'sprite').length === 2)
      assert(world.each('position', 'velocity', 'sprite').length === 1)
      assert(world.each('velocity', 'sprite').length === 2)
    }

    // Remove test entities, create more test entities
    let count = 0
    world.each('sprite', ({ sprite }, entity) => {
      ++count
      entity.destroy()
    })
    assert(count === 4)

    count = 0
    world.each('sprite', ({ sprite }, entity) => {
      ++count
      entity.destroy()
    })
    assert(count === 0)

    assert(g.count === 4)

    // Ensure indexes are still good
    for (let i = 0; i < REPEAT; ++i) {
      assert(world.each().length === 4)
      assert(world.each('noOtherComponents').length === 1)
      assert(world.each('sideEffect').length === 1)
      assert(world.each('sprite').length === 0)
      assert(world.each('velocity').length === 2)
      assert(world.each('position').length === 2)
    }

    count = 0
    world.each('velocity', ({ velocity }, entity) => {
      ++count
      entity.destroy()
    })
    expect(count).toBe(2)

    count = 0
    world.each('velocity', ({ velocity }, entity) => {
      ++count
      entity.destroy()
    })
    assert(count === 0)

    // Ensure indexes are still good
    for (let i = 0; i < REPEAT; ++i) {
      assert(world.each().length === 2)
      assert(world.each('noOtherComponents').length === 1)
      assert(world.each('sideEffect').length === 0)
      assert(world.each('sprite').length === 0)
      assert(world.each('velocity').length === 0)
      assert(world.each('position').length === 1)
    }

    count = 0
    world.each('position', ({ position }, entity) => {
      ++count
      entity.destroy()
    })
    expect(count).toBe(1)

    count = 0
    world.each('position', ({ position }, entity) => {
      ++count
      entity.destroy()
    })
    assert(count === 0)

    world.each('noOtherComponents')[0].destroy()

    // Ensure new indexes are good
    for (let i = 0; i < REPEAT; ++i) {
      assert(world.each().length === 0)
      assert(world.each('noOtherComponents').length === 0)
      assert(world.each('sideEffect').length === 0)
      assert(world.each('sprite').length === 0)
      assert(world.each('velocity').length === 0)
      assert(world.each('position').length === 0)
    }
  }
})

test('system: system variadic arguments with optional components', () => {
  const world = new World()
  let created = false
  world.system(
    class {
      constructor(first, second) {
        assert(first === 1)
        assert(second === 2)
        created = true
      }
    },
    1,
    2
  )
  assert(created)
})

test('system: use the each() method', () => {
  const world = new World()
  let ent1 = world.entity().set('position', {}).set('"velocity"', {})
  let ent2 = world.entity().set('position', {})
  let ent3 = world.entity().set('position:"velocity"', {})
  let externalVar = 5
  world.each('position', ({ position: pos }, ent) => {
    assert(pos)
    assert(ent)
    assert(ent.has('position'))
    assert(externalVar === 5)
  })
  world.each('position', function ({ position: pos }, ent) {
    assert(pos)
    assert(ent)
    assert(ent.has('position'))
    assert(externalVar === 5)
  })

  // Test hash collisions and escaping
  world.each('position:"velocity"')
  let count = 0
  world.each(
    'position',
    '"velocity"',
    function ({ position: pos, ['"velocity"']: vel }, ent) {
      assert(pos)
      assert(vel)
      assert(ent)
      assert(ent.has('position', '"velocity"'))
      ++count
    }
  )
  expect(count).toBe(1)

  // Test iterator usage
  count = 0
  let results = world.each('position', '"velocity"')
  for (let ent of results) {
    ++count
  }
  expect(count).toBe(1)

  // Passing callbacks cause the return value to be undefined
  results = world.each('position', () => {})
  assert(results === undefined)
  results = world.each(() => {})
  assert(results === undefined)

  // Test breaking out of the loop (with components)
  count = 0
  world.each('position', function ({ position }, ent) {
    assert(position)
    assert(ent)
    assert(ent.has('position'))
    ++count
    return false
  })
  expect(count).toBe(1)

  // Test breaking out of the loop (without components)
  count = 0
  world.each(function (_, ent) {
    assert(ent)
    assert(ent.valid())
    ++count
    return false
  })
  expect(count).toBe(1)

  // And just to be sure there are more than 1
  count = world.each('position').length
  expect(count).toBe(2)

  // Invalid args
  expect(() => {
    world.each('position', () => {}, 999)
  }).toThrow()
})

test('system: test indexing with each()', () => {
  const world = new World()
  world.component('position', function (val = 0) {
    this.val = val
  })
  let ent1 = world.entity().set('position', 1).set('velocity')
  let ent2 = world.entity().set('position', 10)
  let ent3 = world.entity().set('position', 100).set('velocity').set('sprite')
  let count = 0
  world.each(
    'position',
    'velocity',
    ({ position: pos, velocity: vel }, ent) => {
      assert(ent.has('position', 'velocity'))
      count += pos.val
    }
  )
  assert(count == 101)
  count = 0

  ent1.remove('position')
  ent1.set('sprite')
  ent2.set('velocity')
  world.each(
    'position',
    'velocity',
    ({ position: pos, velocity: vel }, ent) => {
      assert(ent.has('position', 'velocity'))
      count += pos.val
    }
  )
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
  world.system(
    class {
      run() {
        world.each(() => {
          ++count
        })
      }
    }
  )
  world.run()
  expect(count).toEqual(3)
})
