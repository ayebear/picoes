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
	* [Examples](#examples)
	* [Documentation](#documentation)
* [Old Examples](#old-examples)

## About

Pico Entity System for JavaScript (ES6+).

Read up on what an ECS is here: [https://en.wikipedia.org/wiki/Entity_component_system](https://en.wikipedia.org/wiki/Entity_component_system)

This entity system is designed to be as simple as possible, while still having useful features.

### Features

* Extremely fast entity querying support: O(1) average time
* Strings as component keys
* Access/create pattern, like a dictionary
* ES6+ style API
* JSON serialization
* Prototypes

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

```bash
npm i -D picoes
```

### Examples

```javascript
let world = new World()

// Create player
let player = world.entity().set('health', { value: 100 })

// Create enemies
world.entity().set('damages', 10)
world.entity().set('damages', 30)

// Apply damage
world.every(['damages'], (amount) => {
	player.get('health').value -= amount
})

// Player now has reduced health
assert(player.get('health').value === 60)
```

### Documentation

Generated documentation may be available here in the future.

## Old Examples

I'll keep these here for now until the API documentation is complete.

### Create a world

```javascript
import {World} from 'picoes.js'

let world = new World()
```

### Register components

This registers a component called position.

```javascript
world.component('position', class {
	constructor(x = 0, y = 0) {
		this.x = x
		this.y = y
	}
})
```

It is completely optional to register components. They may help structure your data, or provide basic methods to use with the components. Component definitions must be of type "function", which includes classes.

#### onRemove

This gets called when a component is removed:

```javascript
let removed = 0

world.component('sprite', class {
	onRemove() {
		removed++
	}
})

let entity = world.entity().set('sprite')

assert(removed === 0)

entity.remove('sprite')

assert(removed === 1)
```

It also gets called when an entire entity is destroyed:

```javascript
let entity2 = world.entity().set('sprite')

assert(removed === 1)

entity2.destroy()

assert(removed === 2)
```

#### onCreate

This gets called immediately after the component is constructed. The first argument is always the parent entity, followed by the arguments passed into "set". It can be used as an alternative to the constructor, whenever you need access to the entity:

```javascript
world.component('player', class {
	onCreate(entity, texture) {
		entity.set('sprite', texture)
	}
})

world.entity().set('player', 'player.png')
```

### Register systems

This registers a basic movement system. PicoES will create an instance of the class for you, so do not try to pass in an already instantiated object.

```javascript
world.system(['position', 'velocity'], class {
	every(position, velocity) {
		position.x += velocity.x
		position.y += velocity.y
	}
})
```

This will loop through all entities in the world with both 'position' and 'velocity' components, whenever world.run() is called. The arguments of every() contain the actual component objects which you can read/modify.

**Note:** Most edge cases are handled correctly. Deleting an entity that hasn't been iterated over yet, will not be iterated over. Also, entities that do not satisfy the condition of having all required components will not be included (even if it is changed during the loop). Newly added entities will not be included in the loop either.

It is also possible to get the entire entity by adding it as the last parameter:

```javascript
world.system(['position', 'velocity'], class {
	every(position, velocity, entity) {
		position.x += velocity.x
		position.y += velocity.y
		if (entity.has('sprite')) {
			entity.get('sprite').position = position
		}
	}
})
```

You can pass arguments to the constructors of systems:

```javascript
class MovementSystem {
	constructor(factor) {
		this.factor = factor
	}

	every(position, velocity, entity) {
		position.x += velocity.x * factor
		position.y += velocity.y * factor
	}
}

world.system(['position', 'velocity'], MovementSystem, 1000)
```

This is more useful when your systems are generic and/or require some kind of context. You can also pass arguments to initialize() if you would like to do that later in the process.

### System methods

The following methods are called if defined:

* **`initialize(...args)`** - Called from `world.initialize()`
* **`pre(...args)`** - Called before `every()`, from `world.run()`
* **`every(...components, entity, ...args)`** - Called between `pre()` and `post()`.
	* Called for each entity that matches all specified components.
* **`post(...args)`** - Called after `every()`, from `world.run()`

### Run systems

Run all systems in the order they were registered.

```javascript
world.run()
```

Before running, you may initialize systems to call the initialize() method on them.

```javascript
world.initialize()
```

You can pass arguments to all of these methods:

```javascript
world.initialize(renderer)

world.run(dt)
```

The systems would need to be defined as such to accept these parameters:

```javascript
world.system(['position', 'velocity'], class {
	initialize(renderer) {
		this.renderer = renderer
	}

	pre(dt) {...}

	every(position, velocity, entity, dt) {
		position.x += velocity.x * dt
		position.y += velocity.y * dt
	}

	post(dt) {...}
})
```

Due to the nature of JavaScript, all of these are still optional - you don't need to define initialize, and you don't need to make it take any parameters.

### Create entities

This creates a new entity inside the world, and returns it.

```javascript
let entity = world.entity()
```

### Use entities

#### Check if a component exists

```javascript
entity.has('position')
```

#### Check if multiple components all exist

```javascript
entity.has('position', 'velocity', 'sprite')
```

#### Get a component

**Note:** This method will **not** automatically create the component if it doesn't exist.

```javascript
let position = entity.get('position')

let distance = position.x - someOtherPosition
```

#### Modify a component

**Note:** The following methods will create the component if it does not already exist!

##### Using access

Get component first to access or set any of its properties.

```javascript
entity.access('position').x += 50
```

##### Using set

Create or overwrite a component with the component's constructor.

```javascript
entity.set('position', 50)
```

##### Using update

Update individual component properties from an object.

```javascript
entity.update('position', {
	x: 50
})
```

#### Remove a component

Removes a component from an entity. Has no effect when it does not exist.

```javascript
entity.remove('position')
```

### Destroy entities

Remove an entity from the world.

```javascript
entity.destroy()
```

### Destroy all entities in the world

Remove all entities in a world instance, without getting rid of system/component definitions.

```javascript
world.clear()
```

### Seralization

#### Serialize an entity to a JSON string

```javascript
let str = entity.toJSON()
```

#### Deserialize an entity from a JSON string

```javascript
entity.fromJSON(data)
```

### Prototypes

#### Register a prototype

This will create a "prototype", which is a template for an entity to be created from.

```javascript
world.prototype({'Player': {
	position: {},
	velocity: {},
	sprite: {
		texture: 'player.png'
	}
}})
```

Note that the top level of the object specifies the prototype name. This way you can specify multiple prototypes:

```javascript
world.prototype({
	'Player': {...},
	'NPC': {...},
	'Enemy': {...}
})
```

You can also register prototypes from strings with the same syntax:

```javascript
let data = '{"Player": {"position": {}, "sprite": {"texture": "player.png"}}}'

world.prototype(data)
```

#### Create an entity from a prototype

This will create an entity and initialize components based on the "Player" prototype that was registered. If no prototype exists of this name, an empty entity will be created instead.

```javascript
world.entity('Player')
```

### Iterate over entities

PicoES uses a cached index, which is built on-demand. This means that the first time a query is done internally, it will build an initial index. Every subsequent call will just return the entities already stored in the index. Whenever components or entities are added or removed, all of the indexes are updated with this change.

#### Iterate through entities from component names

This works exactly the same as systems, and is actually used internally to run the every() method on systems.

```javascript
world.every(['position', 'velocity'], (position, velocity, entity) => {
	position.x += velocity.x
	position.y += velocity.y
})
```

#### Get a set of entities from component names

The callback parameter in every() is optional. The return value can be used instead to get an iterator to the entities with the specified component names.

```javascript
let entities = world.every(['position', 'velocity'])
for (let entity of entities) {
	assert(entity.has('position'))
	assert(entity.has('velocity'))
}
```

It is also possible to get all entities with an empty array query:

```javascript
let entities = world.every([])
```

Note that this applies to systems as well.

#### Component query rules for every()

* AND logic, but without exact matching
* Above query **does** include entities such as ['position', 'velocity', 'sprite']
* Above query **does not** include entities such as ['position', 'sprite']
