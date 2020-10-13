# PicoES

[![Build Status](https://travis-ci.org/ayebear/picoes.svg?branch=master)](https://travis-ci.org/ayebear/picoes)

### Table Of Contents

-   [About](#about)
    -   [Features](#features)
    -   [Terminology](#terminology)
    -   [License](#license)
    -   [Author](#author)
-   [Instructions](#instructions)
    -   [Setup](#setup)
    -   [Documentation](#documentation)
    -   [Examples](#examples)

## About

Pico Entity System for JavaScript (ES6+).

Read up on what an ECS is here: [https://en.wikipedia.org/wiki/Entity_component_system](https://en.wikipedia.org/wiki/Entity_component_system)

This entity system is designed to be as simple as possible, while still having useful features.

### Features

-   **Simple query syntax**
    -   `world.each('a', 'b', ({a, b}) => { a.foo = b.bar })`
	-   See the examples below for more advanced usage, or the [reference docs](https://ayebear.com/picoes/class/src/world.js~World.html#instance-method-each)
-   **No formal declarations required**
    -   Can create components and entities in a world and query on them, without needing to define structured systems and components
-   **Strings as component keys**
    -   No need to manually define component keys, or manually include component classes to use them
-   **Automatic dependency injection for systems**
    -   No need to pass state to each system, can have a single context that gets injected into all systems automatically
-   **High performance indexing options**
    -   SimpleIndex (Default): O(1) component add/remove, O(m) query time
        -   Where `m` is the smallest size component index
    -   MemoizedQueryIndex: O(q) component add/remove, O(1) average query time (memoized), O(n) worst query time (initial)
        -   Where `q` is the total number of memoized queries
        -   And `n` is the total number of entities
    -   _Note: Above time complexities are amortized assuming the number of components used is a known constant_
    -   Can also write your own and pass it to the World constructor! Needs clear, add, remove, and query.
-   **Prototypes**
    -   Allows entity definitions to be data-driven, outside of code

### Terminology

-   **Component:** Holds some related data
    -   Example: Position, Velocity, Health
-   **Entity:** Refers to a collection of components
    -   Example: Position + Health could represent a player
-   **Prototype:** A template of components used for creating entities
    -   Example: Player could contain Position, Velocity, and Health
-   **System:** Logic loop that processes entities
    -   Example: Movement system which handles positions and velocities
-   **World:** Lets you register components, systems, and prototypes in a self-contained object - which avoids the use of singletons. This is also where you can create entities from.

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

[PicoES Documentation](https://ayebear.com/picoes)

### Examples

#### Shorthand anonymous components and systems

```javascript
// import { World } from 'picoes'
const { World } = require('picoes')

// Create a world to store entities in
const world = new World()

// Create player with anonymous health component
const player = world.entity().set('health', { value: 100 })

// Create enemies
world.entity().set('damages', 10)
world.entity().set('damages', 30)

// Apply damage
world.each('damages', ({ damages }) => {
	player.get('health').value -= damages
})

// Player now has reduced health
console.assert(player.get('health').value === 60)
```

#### Full component and system definitions

```javascript
// const { World } = require('picoes')
import { World } from 'picoes'

// Create a world to store entities in
const world = new World()

// Define and register components
class Vec2 {
	constructor(x = 0, y = 0) {
		this.x = x
		this.y = y
	}
}
world.component('position', Vec2)
world.component('velocity', Vec2)
world.component('health', class {
	constructor(start = 100) {
		this.value = start
	}
})

// Example of using onCreate and onRemove
world.component('sprite', class {
	onCreate(texture) {
		// this.entity is auto-injected into registered components
		// It is not available in the constructor, but is available in onCreate
		this.container = this.entity.get('gameContainer')
		this.sprite = new Sprite(texture)
		this.container.add(this.sprite)
	}

	onRemove() {
		this.container.remove(this.sprite)
	}
})

// Define systems
// Log statements are to show flow order below
class MovementSystem {
	constructor(...args) {
		console.log('constructor() called with args:', ...args)
	}

	run(dt) {
		console.log(`run(${dt}) called`)
		world.each('position', 'velocity', ({ position, velocity }, entity) => {
			console.log(`each() called for entity ${entity.id}`)
			position.x += velocity.x * dt
			position.y += velocity.y * dt
		})
	}
}

// Register systems
world.system(MovementSystem, 'extra', 'args')

// Create entity without prototype
const entityA = world.entity().set('position').set('velocity')
console.assert(entityA.has('position'))
console.assert(entityA.has('velocity'))

// Create entity with prototype (results are the same as above)
world.prototype({
	Movable: {
		position: {},
		velocity: {},
	},
})
const entityB = world.entity('Movable')
console.assert(entityB.has('position'))
console.assert(entityB.has('velocity'))

// This will re-create the component using the constructor
entityB.set('position', 100, 100)

// This set a property in the existing component
entityA.get('position').x = 100

// Set velocities by using update()
entityA.update('velocity', { x: 10, y: 10 })
entityB.update('velocity', { x: -10, y: -10 })

// Run systems (pass one second for dt)
world.run(1.0)

// Since the movement system ran once, the positions changed by the amount of their velocity
console.assert(entityA.get('position').x === 110)
console.assert(entityA.get('position').y === 10)
console.assert(entityB.get('position').x === 90)
console.assert(entityB.get('position').y === 90)
```

Expected output:

```
constructor() called with args: extra args
run(1) called
each() called for entity 1
each() called for entity 2
```
