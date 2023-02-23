import { World } from '../index.js'
import { Entity } from '../src/entity.js'
import { getSize, has } from './test_utils.js'

test('world: create a world', () => {
  const world = new World()
  expect(world instanceof World).toBeTruthy()
  expect(typeof world.component === 'function').toBeTruthy()
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
  expect(world1.systems).toHaveLength(0)
  expect(getSize(world1.components)).toBe(0)
  expect(getSize(world1.context)).toBe(1)
  const world2 = new World({
    components: {},
    systems: [],
    context: {},
  })
  expect(world2).toBeInstanceOf(World)
  expect(world2.systems).toHaveLength(0)
  expect(getSize(world2.components)).toBe(0)
  expect(getSize(world2.context)).toBe(1)
  const world3 = new World({
    components: { position, velocity },
    systems: [input, physics, render],
    context: { state },
  })
  expect(world3).toBeInstanceOf(World)
  expect(world3.systems).toHaveLength(3)
  expect(getSize(world3.components)).toBe(2)
  expect(getSize(world3.context)).toBe(2)
  expect(Object.keys(world3.context)).toEqual(['state', 'world'])
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
  expect('position' in world.components).toBeTruthy()
  expect(Object.keys(world.components).length == 1).toBeTruthy()
  expect(ent.has('position')).toBeTruthy()
  expect(ent.get('position').x === 1).toBeTruthy()
  expect(ent.get('position').y === 2).toBeTruthy()
  expect(ent.get('position').inc(5) === 6).toBeTruthy()

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
  expect('velocity' in world.components).toBeTruthy()
  expect(Object.keys(world.components).length == 2).toBeTruthy()
  expect(ent2.has('velocity')).toBeTruthy()
  expect(ent2.get('velocity').x === 1).toBeTruthy()
  expect(ent2.get('velocity').y === 2).toBeTruthy()
  expect(ent2.get('velocity').inc(5) === 6).toBeTruthy()
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
  expect(player.get('health').value === 60).toBeTruthy()
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
  expect(Object.keys(world.components).length === 0).toBeTruthy()
})

test('component: use an empty component', () => {
  const world = new World()
  let ent = world.entity().set('position', {
    x: 1,
  })
  expect(ent.has('position')).toBeTruthy()
  expect(ent.get('position').x === 1).toBeTruthy()

  let ent2 = world.entity().set('velocity', {
    x: 2,
  })
  expect(ent2.has('velocity')).toBeTruthy()
  expect(ent2.get('velocity').x === 2).toBeTruthy()
  ent2.set('velocity', {
    y: 3,
  })
  expect(ent2.get('velocity').x === undefined).toBeTruthy()
  expect(ent2.get('velocity').y === 3).toBeTruthy()
  ent2.get('velocity').x = 42
  expect(ent2.get('velocity').x === 42).toBeTruthy()
  expect(ent2.get('velocity').y === 3).toBeTruthy()

  let ent3 = world.entity().set('singleValue', 5)
  expect(ent3.has('singleValue')).toBeTruthy()
  expect(ent3.get('singleValue') === 5).toBeTruthy()
  ent3.set('singleValue', 500)
  expect(ent3.get('singleValue') === 500).toBeTruthy()

  let ent4 = world.entity().set('string', 'hello')
  expect(ent4.has('string')).toBeTruthy()
  expect(ent4.get('string') === 'hello').toBeTruthy()
  ent4.set('string', 'goodbye')
  expect(ent4.get('string') === 'goodbye').toBeTruthy()

  ent4.remove('string')
  expect(!ent4.has('string')).toBeTruthy()
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
    expect(position.x >= 1).toBeTruthy()
    expect(position.y >= 2).toBeTruthy()
    ++count
  })
  expect(count === 3).toBeTruthy()

  world.clear()

  count = 0
  world.each('position', ({ position }) => {
    ++count
  })
  world.each((_, ent) => {
    ++count
  })
  expect(count === 0).toBeTruthy()
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
        expect(texture && texture === this.texture).toBeTruthy()
        expect(size && size === this.size).toBeTruthy()
        expect(invalid === undefined).toBeTruthy()

        // Regression in 0.3.0, fixed in 0.3.1
        expect(this.entity.get('sprite') === this).toBeTruthy()
      }
    }
  )

  let ent = world.entity().set('sprite', 'test.png', 100)
  expect(ent.get('sprite').constructorCalled === 1).toBeTruthy()
  expect(ent.get('sprite').entity === ent).toBeTruthy()
  expect(ent.get('sprite').texture === 'test.png').toBeTruthy()
  expect(ent.get('sprite').size === 100).toBeTruthy()
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
  expect(spriteCount === 1).toBeTruthy()

  let ent2 = world.entity().set('sprite')
  expect(spriteCount === 2).toBeTruthy()

  world.clear()
  expect(spriteCount === 0).toBeTruthy()
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
  expect(spriteCount === 1).toBeTruthy()

  let ent2 = world.entity().set('sprite').set('position', { x: 2 })
  expect(spriteCount === 2).toBeTruthy()

  // Test detaching
  expect(ent.valid()).toBeTruthy()
  ent.detach()
  expect(!ent.valid()).toBeTruthy()
  expect(spriteCount === 2).toBeTruthy()
  expect(world.entities.entities.size === 1).toBeTruthy()
  expect(getSize(world.each('position')) === 1).toBeTruthy()
  expect(world.each('position').length === 1).toBeTruthy()
  expect(world.each('position')[0].get('position').x === 2).toBeTruthy()
  expect(ent.get('position').x === 1).toBeTruthy()

  // Test attaching
  ent.attach(world)
  expect(ent.valid()).toBeTruthy()
  expect(spriteCount === 2).toBeTruthy()
  expect(world.entities.entities.size === 2).toBeTruthy()
  expect(getSize(world.each('position')) === 2).toBeTruthy()
  expect(world.each('position').length === 2).toBeTruthy()
  expect(ent.get('position').x === 1).toBeTruthy()

  // Test edge cases
  ent.detach()
  expect(!ent.valid()).toBeTruthy()
  ent.detach()
  expect(!ent.valid()).toBeTruthy()
  ent.attach()
  expect(!ent.valid()).toBeTruthy()
  ent.attach(world)
  expect(ent.valid()).toBeTruthy()
})

test('component: test detached entities', () => {
  const world = new World()
  let ent = world
    .entity()
    .set('sprite', { texture: 'image.png' })
    .set('position', 5)

  expect(ent.valid()).toBeTruthy()
  expect(ent.has('sprite')).toBeTruthy()
  expect(ent.has('position')).toBeTruthy()
  expect(ent.get('sprite').texture === 'image.png').toBeTruthy()
  expect(ent.get('position') === 5).toBeTruthy()

  ent.detach()

  expect(!ent.valid()).toBeTruthy()
  expect(ent.has('sprite')).toBeTruthy()
  expect(ent.has('position')).toBeTruthy()
  expect(ent.get('sprite').texture === 'image.png').toBeTruthy()
  expect(ent.get('position') === 5).toBeTruthy()

  ent.set('velocity', { x: 10 })
  expect(ent.has('velocity')).toBeTruthy()
  expect(ent.get('velocity').x === 10).toBeTruthy()

  ent.set('position', 6)
  expect(ent.has('position')).toBeTruthy()
  expect(ent.get('position') === 6).toBeTruthy()

  ent.remove('position')
  expect(!ent.has('position')).toBeTruthy()

  // Create entity outside of the world
  let ent2 = new Entity()
  expect(!ent2.valid()).toBeTruthy()
  ent2.set('velocity', { x: 30 })
  ent2.set('position', 7)
  expect(ent2.has('velocity', 'position')).toBeTruthy()
  expect(ent2.get('velocity').x === 30).toBeTruthy()
  expect(ent2.get('position') === 7).toBeTruthy()
  ent2.remove('velocity', 'position')
  expect(!ent2.has('velocity')).toBeTruthy()
  expect(!ent2.has('position')).toBeTruthy()
})

test('system: define a system', () => {
  const world = new World()
  world.system(class {})
  expect(world.systems.length == 1).toBeTruthy()
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
  expect(world.systems[0].maxVelocity === 3500).toBeTruthy()
  expect(world.systems[0].canvas === 'someCanvas').toBeTruthy()
  expect(world.systems[0].textures[0] === 'textures.png').toBeTruthy()
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
  world.context = state // Set keyless context
  world.system(velocitySystem, false) // New system
  expect(world.systems.length).toEqual(2)
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
  world.context = { state } // Set keyed context
  world.system(velocitySystem, false) // New system
  expect(world.systems.length).toEqual(2)
  world.run()
  expect(ran).toEqual([false, true, false])
})

test('system: system iteration', () => {
  const world = new World()
  world.system(
    class {
      run(dt, total) {
        expect(dt > 0).toBeTruthy()
        expect(total > 0).toBeTruthy()
        this.world.each(
          'position',
          'velocity',
          ({ entity, position, velocity }) => {
            expect(position).toBeTruthy()
            expect(velocity).toBeTruthy()
            position.x += velocity.x
            position.y += velocity.y
            expect(entity).toBeTruthy()
            expect(entity.has('position')).toBeTruthy()
            expect(entity.has('velocity')).toBeTruthy()
            expect(dt > 0).toBeTruthy()
            expect(total > 0).toBeTruthy()
          }
        )
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

  expect(
    entA.get('position').x == 1 && entA.get('position').y == 1
  ).toBeTruthy()
  expect(
    entB.get('position').x == 30 && entB.get('position').y == 40
  ).toBeTruthy()

  world.run(dt, total)

  expect(
    entA.get('position').x == 2 && entA.get('position').y == 1
  ).toBeTruthy()
  expect(
    entB.get('position').x == 29 && entB.get('position').y == 42
  ).toBeTruthy()

  total += dt
  world.run(dt, total)

  expect(
    entA.get('position').x == 3 && entA.get('position').y == 1
  ).toBeTruthy()
  expect(
    entB.get('position').x == 28 && entB.get('position').y == 44
  ).toBeTruthy()
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
        expect(this.val === 10).toBeTruthy()
        this.world.each('position', ({ position }) => {
          position.x = 1
          ++methodsCalled
          expect(this.val === 10).toBeTruthy()
        })
      }
    }
  )

  world.system(class {})
  expect(() => {
    world.system()
  }).toThrow()

  world.entity().set('position', {})
  expect(methodsCalled == 2).toBeTruthy()
  world.run()
  expect(methodsCalled == 4).toBeTruthy()
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
        this.world.each(
          ['position', 'velocity'],
          ({ entity, position, velocity }) => {
            ++count
            if (count == 1) {
              testEnt1.remove('position', 'velocity')
              testEnt2.remove('position')
              testEnt0.remove('velocity')
              return
            }
            expect(position).toBeTruthy()
            expect(velocity).toBeTruthy()
            position.x += velocity.x
            position.y += velocity.y
            expect(entity).toBeTruthy()
            expect(entity.has('position')).toBeTruthy()
            expect(entity.has('velocity')).toBeTruthy()

            // Make sure the test entities do not show up here
            expect(entity.id !== testEnt0.id).toBeTruthy()
            expect(entity.id !== testEnt1.id).toBeTruthy()
            expect(entity.id !== testEnt2.id).toBeTruthy()
          }
        )
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

  expect(
    entA.get('position').x == 1 && entA.get('position').y == 1
  ).toBeTruthy()
  expect(
    entB.get('position').x == 30 && entB.get('position').y == 40
  ).toBeTruthy()

  world.run()

  expect(
    entA.get('position').x == 2 && entA.get('position').y == 1
  ).toBeTruthy()
  expect(
    entB.get('position').x == 29 && entB.get('position').y == 42
  ).toBeTruthy()

  world.run()

  expect(
    entA.get('position').x == 3 && entA.get('position').y == 1
  ).toBeTruthy()
  expect(
    entB.get('position').x == 28 && entB.get('position').y == 44
  ).toBeTruthy()
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
      expect(world.each('noOtherComponents').length === 1).toBeTruthy()
      expect(world.each('sideEffect').length === 0).toBeTruthy()
      expect(world.each('sprite').length === 4).toBeTruthy()
      expect(world.each('velocity').length === 4).toBeTruthy()
      expect(world.each().length === 8).toBeTruthy()
      expect(world.each('position').length === 4).toBeTruthy()
      expect(world.each('position', 'velocity').length === 2).toBeTruthy()
      expect(world.each('position', 'sprite').length === 2).toBeTruthy()
      expect(
        world.each('position', 'velocity', 'sprite').length === 1
      ).toBeTruthy()
      expect(world.each('velocity', 'sprite').length === 2).toBeTruthy()
    }

    // Remove test entities, create more test entities
    let count = 0
    world.each('sprite', ({ entity, sprite }) => {
      ++count
      entity.destroy()
    })
    expect(count === 4).toBeTruthy()

    count = 0
    world.each('sprite', ({ entity, sprite }) => {
      ++count
      entity.destroy()
    })
    expect(count === 0).toBeTruthy()

    expect(g.count === 4).toBeTruthy()

    // Ensure indexes are still good
    for (let i = 0; i < REPEAT; ++i) {
      expect(world.each().length === 4).toBeTruthy()
      expect(world.each('noOtherComponents').length === 1).toBeTruthy()
      expect(world.each('sideEffect').length === 1).toBeTruthy()
      expect(world.each('sprite').length === 0).toBeTruthy()
      expect(world.each('velocity').length === 2).toBeTruthy()
      expect(world.each('position').length === 2).toBeTruthy()
    }

    count = 0
    world.each('velocity', ({ entity, velocity }) => {
      ++count
      entity.destroy()
    })
    expect(count).toBe(2)

    count = 0
    world.each('velocity', ({ entity, velocity }) => {
      ++count
      entity.destroy()
    })
    expect(count === 0).toBeTruthy()

    // Ensure indexes are still good
    for (let i = 0; i < REPEAT; ++i) {
      expect(world.each().length === 2).toBeTruthy()
      expect(world.each('noOtherComponents').length === 1).toBeTruthy()
      expect(world.each('sideEffect').length === 0).toBeTruthy()
      expect(world.each('sprite').length === 0).toBeTruthy()
      expect(world.each('velocity').length === 0).toBeTruthy()
      expect(world.each('position').length === 1).toBeTruthy()
    }

    count = 0
    world.each('position', ({ entity, position }) => {
      ++count
      entity.destroy()
    })
    expect(count).toBe(1)

    count = 0
    world.each('position', ({ entity, position }) => {
      ++count
      entity.destroy()
    })
    expect(count === 0).toBeTruthy()

    world.each('noOtherComponents')[0].destroy()

    // Ensure new indexes are good
    for (let i = 0; i < REPEAT; ++i) {
      expect(world.each().length === 0).toBeTruthy()
      expect(world.each('noOtherComponents').length === 0).toBeTruthy()
      expect(world.each('sideEffect').length === 0).toBeTruthy()
      expect(world.each('sprite').length === 0).toBeTruthy()
      expect(world.each('velocity').length === 0).toBeTruthy()
      expect(world.each('position').length === 0).toBeTruthy()
    }
  }
})

test('system: system variadic arguments with optional components', () => {
  const world = new World()
  let created = false
  world.system(
    class {
      constructor(first, second) {
        expect(first === 1).toBeTruthy()
        expect(second === 2).toBeTruthy()
        created = true
      }
    },
    1,
    2
  )
  expect(created).toBeTruthy()
})

test('system: use the each() method', () => {
  const world = new World()
  let ent1 = world.entity().set('position', {}).set('"velocity"', {})
  let ent2 = world.entity().set('position', {})
  let ent3 = world.entity().set('position:"velocity"', {})
  let externalVar = 5
  world.each('position', ({ entity: ent, position: pos }) => {
    expect(pos).toBeTruthy()
    expect(ent).toBeTruthy()
    expect(ent.has('position')).toBeTruthy()
    expect(externalVar === 5).toBeTruthy()
  })
  world.each('position', function ({ entity: ent, position: pos }) {
    expect(pos).toBeTruthy()
    expect(ent).toBeTruthy()
    expect(ent.has('position')).toBeTruthy()
    expect(externalVar === 5).toBeTruthy()
  })

  // Test hash collisions and escaping
  world.each('position:"velocity"')
  let count = 0
  world.each(
    'position',
    '"velocity"',
    function ({ position: pos, ['"velocity"']: vel }, ent) {
      expect(pos).toBeTruthy()
      expect(vel).toBeTruthy()
      expect(ent).toBeTruthy()
      expect(ent.has('position', '"velocity"')).toBeTruthy()
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
  expect(results === undefined).toBeTruthy()
  results = world.each(() => {})
  expect(results === undefined).toBeTruthy()

  // Test breaking out of the loop (with components)
  count = 0
  world.each('position', function ({ position }, ent) {
    expect(position).toBeTruthy()
    expect(ent).toBeTruthy()
    expect(ent.has('position')).toBeTruthy()
    ++count
    return false
  })
  expect(count).toBe(1)

  // Test breaking out of the loop (without components)
  count = 0
  world.each(function (_, ent) {
    expect(ent).toBeTruthy()
    expect(ent.valid()).toBeTruthy()
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
      expect(ent.has('position', 'velocity')).toBeTruthy()
      count += pos.val
    }
  )
  expect(count == 101).toBeTruthy()
  count = 0

  ent1.remove('position')
  ent1.set('sprite')
  ent2.set('velocity')
  world.each(
    'position',
    'velocity',
    ({ position: pos, velocity: vel }, ent) => {
      expect(ent.has('position', 'velocity')).toBeTruthy()
      count += pos.val
    }
  )
  expect(count == 110).toBeTruthy()

  ent1.remove('sprite')
  ent2.remove('sprite')
  ent3.remove('sprite')

  // Query for all entities
  let test = world.each()
  expect(getSize(test) == 3).toBeTruthy()

  let ent4 = world.entity()
  expect(getSize(world.each()) == 4).toBeTruthy()
  expect(has(world.each(), ent4)).toBeTruthy()

  ent4.set('velocity')
  expect(getSize(world.each()) == 4).toBeTruthy()
  expect(has(world.each(), ent4)).toBeTruthy()

  ent4.remove('velocity')
  expect(getSize(world.each()) == 4).toBeTruthy()
  expect(has(world.each(), ent4)).toBeTruthy()

  ent4.destroy()
  expect(getSize(world.each()) == 3).toBeTruthy()
  expect(!has(world.each(), ent4)).toBeTruthy()

  count = 0
  world.each(ent => {
    ++count
  })
  expect(count == 3).toBeTruthy()

  count = 0
  world.system(
    class {
      run() {
        this.world.each(() => {
          ++count
        })
      }
    }
  )
  world.run()
  expect(count).toEqual(3)
})
