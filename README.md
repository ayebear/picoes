# PicoES

![Build Status](https://github.com/ayebear/picoes/actions/workflows/node.js.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/ayebear/picoes/badge.svg?branch=master)](https://coveralls.io/github/ayebear/picoes?branch=master)
[![Documentation Status](https://ayebear.com/picoes/badge.svg)](https://ayebear.com/picoes/source.html)

### Table Of Contents

- [About](#about)
  - [Features](#features)
  - [Terminology](#terminology)
  - [License](#license)
  - [Author](#author)
- [Instructions](#instructions)
  - [Setup](#setup)
  - [Documentation](#documentation)
  - [Examples](#examples)

## About

Pico Entity System for JavaScript (ES6+).

Read up on what an ECS is here: [https://en.wikipedia.org/wiki/Entity_component_system](https://en.wikipedia.org/wiki/Entity_component_system)

### Features

- **Simple query syntax**
  - `world.each('a', 'b', ({a, b}) => { a.foo = b.bar })`
  - See the examples below for more advanced usage, or the [reference docs](https://ayebear.com/picoes/class/src/world.js~World.html#instance-method-each)
- **Optional registration of systems and components**
  - Once a `World` instance is made, you can arbitrarily set components on entities and query them
  - This is possible due to the use of strings as component keys
- **Automatic dependency injection**
  - No need to pass state to each system, can have a single context that gets injected into all systems automatically
  - Registered components also get their parent entity injected
- **Balanced performance**
  - See [ECS benchmark comparison](https://github.com/noctjs/ecs-benchmark)
  - Entity/Component adding/removing performance is good with PicoES, which is important for many games.
  - Continued research is being done to find new ways to make PicoES faster. There are many things such as pools, bit arrays, better indexing structures, and more that could be done to achieve this.

### Terminology

- **Component:** Holds some related data
  - Example: Position, Velocity, Health
- **Entity:** Refers to a collection of components
  - Example: Position and Health could represent a player
- **System:** Logic loop that processes entities
  - Example: Movement system which handles positions and velocities
- **World:** The entry point of all PicoES features. Can register components/systems and create/query entities in a self-contained object - which avoids the use of singletons.

### License

MIT

### Author

Eric Hebert

## Instructions

### Setup

You'll normally want to install PicoES as a dev dependency, and have it transpiled into the build of your application. PicoES uses features such as import/export syntax, so you may need updated tools to use it. It has been used successfully with node 14+ and parcel 2+.

#### Yarn

```bash
yarn add --dev picoes
```

#### NPM

```bash
npm i -D picoes
```

### Documentation

The full reference documentation can be found here:

[PicoES Documentation](https://ayebear.com/picoes)

### Examples

#### Unregistered components and queries

```javascript
import { World } from 'picoes'

// Create a world to store entities in
const world = new World()

// Create a player entity with health component
const player = world.entity().set('health', { value: 100 })

// Create enemies
world.entity().set('damages', 10)
world.entity().set('damages', 30)

// Apply damage to player from enemies
world.each('damages', ({ damages }) => {
  player.get('health').value -= damages
})

// Player now has reduced health
console.assert(player.get('health').value === 60)
```

#### System and component registration

```javascript
import { World } from 'picoes'

// Create a reusable vector component
class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }
}

// Define a system for handling movement
class Movement {
  run(dt) {
    this.world.each('position', 'velocity', ({ position, velocity }) => {
      position.x += velocity.x * dt
      position.y += velocity.y * dt
    })
  }
}

// Create a world, register components and systems
const world = new World({
  components: { position: Vec2, velocity: Vec2 },
  systems: [Movement],
})

// Create an entity at (0,0) with a velocity
const entity = world.entity().set('position').set('velocity', 10, 10)

// Run the systems (typically would use a ticker and pass dt)
world.run(16)

// See that the entity has moved
const { x, y } = entity.get('position')
console.log(x, y) // 160 160
```

For more information, refer to the [full documentation](https://ayebear.com/picoes).
