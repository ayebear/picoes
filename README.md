# PicoES

[![Build Status](https://travis-ci.org/ayebear/picoes.svg?branch=master)](https://travis-ci.org/ayebear/picoes)

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

This entity system is designed to be as simple as possible, while still having useful features.

### Features

- **Simple query syntax**
  - `world.each('a', 'b', ({a, b}) => { a.foo = b.bar })`
  - See the examples below for more advanced usage, or the [reference docs](https://ayebear.com/picoes/class/src/world.js~World.html#instance-method-each)
- **No formal declarations required**
  - Can create **unlimited** (within memory limits) components and entities in a world and query on them, without needing to define structured systems and components
- **Strings as component keys**
  - No need to manually define component keys, or manually include component classes to use them
- **Automatic dependency injection for systems**
  - No need to pass state to each system, can have a single context that gets injected into all systems automatically
- **Balanced performance**
  - See [ECS benchmark comparison](https://github.com/noctjs/ecs-benchmark)
  - Entity/Component adding/removing performance is decent with PicoES, which is important for many games.
  - Active research and work is being done to significantly improve PicoES performance as much as possible without making it harder to use.

### Terminology

- **Component:** Holds some related data
  - Example: Position, Velocity, Health
- **Entity:** Refers to a collection of components
  - Example: Position + Health could represent a player
- **System:** Logic loop that processes entities
  - Example: Movement system which handles positions and velocities
- **World:** The entry point of all PicoES features. Can register components/systems and create/query entities in a self-contained object - which avoids the use of singletons.

### License

MIT

### Author

Eric Hebert

## Instructions

### Setup

You'll normally want to install PicoES as a dev dependency, and have it transpiled into the build of your application.

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

#### Shorthand anonymous components and systems

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

More complete examples coming with final 1.0.0 release! For now, refer to the [full documentation](https://ayebear.com/picoes).
