# PicoES

[![Build Status](https://travis-ci.org/ayebear/picoes.svg?branch=master)](https://travis-ci.org/ayebear/picoes)

### Table Of Contents

* [About](#about)
	* [Features](#features)
	* [Terminology](#terminology)
	* [License](#license)
	* [Author](#author)
* [Instructions](#instructions)
	* [Setup](#setup)
	* [Documentation](#documentation)
	* [Examples](#examples)

## About

Pico Entity System for JavaScript (ES6+).

Read up on what an ECS is here: [https://en.wikipedia.org/wiki/Entity_component_system](https://en.wikipedia.org/wiki/Entity_component_system)

This entity system is designed to be as simple as possible, while still having useful features.

### Features

* High performance, memoized entity queries
	* O(1) average time
* All definitions are optional
	* Can create components and entities in a world and query on them, without needing to define structured systems and components
* Strings as component keys
	* No need to manually track component keys like many libraries
* JSON serialization
	* Useful for save data and networked applications
* Prototypes
	* Allows entity definitions to be data-driven, outside of code

### Terminology

* **Component:** Holds some related data
	* Example: Position, Velocity, Health
* **Entity:** Refers to a collection of components
	* Example: Position + Health could represent a player
* **Prototype:** A template of components used for creating entities
	* Example: Player could contain Position, Velocity, and Health
* **System:** Logic loop that processes entities
	* Example: Movement system which handles positions and velocities
* **World:** Lets you register components, systems, and prototypes in a self-contained object - which avoids the use of singletons. This is also where you can create entities from.

### License

MIT

### Author

Eric Hebert

## Instructions

### Setup

You'll normally want to install PicoES as a dev dependency, and have it transpiled into the build of your application.

```bash
npm i -D picoes
```

### Documentation

[PicoES Documentation](http://ayebear.com/picoes)

### Examples

#### Shorthand anonymous components and systems

```javascript
// import { World } from 'picoes'
const { World } = require('picoes')

// Create a world to store entities in
let world = new World()

// Create player with anonymous health component
let player = world.entity().set('health', { value: 100 })

// Create enemies
world.entity().set('damages', 10)
world.entity().set('damages', 30)

// Apply damage
world.every(['damages'], amount => {
	player.get('health').value -= amount
})

// Player now has reduced health
console.assert(player.get('health').value === 60)
```

#### Full component and system definitions

```javascript
// import { World } from 'picoes'
const { World } = require('picoes')

// Create a world to store entities in
let world = new World()

// Define position and velocity components
world.component('position', class {
	onCreate(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	}
})

world.component('velocity', class {
	onCreate(entity, x = 0, y = 0) {
		this.x = x
		this.y = y
	}
})

// Create movable prototype
world.prototype({
	Movable: {
		position: {},
		velocity: {}
	}
})

// Define movement system
// Note: All system methods are optional, but they are included here to show the flow
world.system(['position', 'velocity'], class {
	constructor() {
		console.log('constructor() called')
	}

	initialize() {
		console.log('initialize() called')
	}

	pre() {
		console.log('pre() called')
	}

	every(position, velocity, entity) {
		console.log(`every() called for entity ${entity.id}`)
		position.x += velocity.x
		position.y += velocity.y
	}

	post() {
		console.log('post() called')
	}
})

// Create entity without prototype
let entityA = world.entity().set('position').set('velocity')
console.assert(entityA.has('position'))
console.assert(entityA.has('velocity'))

// Create entity with prototype (results are the same as above)
let entityB = world.entity('Movable')
console.assert(entityB.has('position'))
console.assert(entityB.has('velocity'))

// This will re-create the component using the constructor
entityB.set('position', 100, 100)

// This set a property in the existing component
entityA.get('position').x = 100

// Set velocities by using update()
entityA.update('velocity', { x: 10, y: 10 })
entityB.update('velocity', { x: -10, y: -10 })

// Initialize systems
world.initialize()

// Run systems
world.run()

// Since the movement system ran once, the positions changed by the amount of their velocity
console.assert(entityA.get('position').x === 110)
console.assert(entityA.get('position').y === 10)
console.assert(entityB.get('position').x === 90)
console.assert(entityB.get('position').y === 90)
```

Expected output:

```
constructor() called
initialize() called
pre() called
every() called for entity 1
every() called for entity 2
post() called
```
