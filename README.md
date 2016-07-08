# PicoES

[![Build Status](https://travis-ci.org/ayebear/picoes.svg?branch=master)](https://travis-ci.org/ayebear/picoes)

### About

Pico Entity System for JavaScript (ES6).

Read up on what an ECS is here: [https://en.wikipedia.org/wiki/Entity_component_system](https://en.wikipedia.org/wiki/Entity_component_system)

This entity system is designed to be as simple as possible, while still having useful features.

#### Features

* Serialization
* Prototypes
* ES6 style API
* String based operations (using component names)
* Access/create pattern (almost like a dictionary)
* Entity querying support (outside of systems)

### Instructions

Full API documentation will be available later, but here is a basic usage guide for now.


#### Create a world

```javascript
import {World} from 'picoes.js'

let world = new World()
```

#### Register components

This registers a component called position.

```javascript
world.component('position', function(x = 0, y = 0) {
	this.x = x
	this.y = y
})
```

You can also register components from objects, but then you cannot use the shorthand set() syntax.

```javascript
world.component('position', {
	x: 0,
	y: 0
})
```

You can also make basic components without any properties. You can add properties to it later on though.

```javascript
world.component('position')
```

#### Register systems

This registers a basic movement system.

```javascript
world.system(['position', 'velocity'], class {
	every(position, velocity) {
		position.x += velocity.x
		position.y += velocity.y
	}
})
```

**Note:** Most edge cases are handled correctly. Deleting an entity that hasn't been iterated over yet, will not be iterated over. Also, entities that do not satisify the condition of having all required components will not be included (even if it is changed during the loop). Newly added entities will not be included in the loop either.

It is also possible to get the entire entity by adding it as the last parameter:

```javascript
world.system(['position', 'velocity'], class {
	every(position, velocity, ent) {
		position.x += velocity.x
		position.y += velocity.y
		if (ent.has('sprite')) {
			ent.get('sprite').position = position
		}
	}
})
```

#### Run systems

Run all systems registered in the world.

```javascript
world.run()
```

Before running, you may initialize systems to call the init() method on them.
```javascript
world.init()
```

#### Create entities

This creates a new entity inside the world, and adds a position component to it.

```javascript
world.entity().set('position', 5, 10)
```

#### Use entities

Assume the following have an entity object defined:
```javascript
let entity = world.entity()
```

##### Check if a component exists

```javascript
entity.has('position')
```

##### Get a component

```javascript
let position = entity.get('position')

let distance = position.x - someOtherPosition
```

##### Modify a component

**Note:** The following methods will create the component if it does not already exist!

###### Using get

Get component first to access or set any of its properties.

```javascript
entity.get('position').x += 50
```

###### Using set

Call the component's constructor function to set values.

```javascript
entity.set('position', 50)
```

###### Using merge

Merge a new object's properties into the component.

```javascript
entity.merge('position', {
	x: 50
})
```

##### Remove a component

```javascript
entity.remove('position')
```

#### Destroy entities

Remove an entity from the world.

```javascript
entity.destroy()
```

#### Seralization

##### Serialize a world, entity, or component to a JSON string

```javascript
world.toJson()

entity.toJson()

entity.get('position').toJson()
```

##### Deserialize a world, entity, or component from a JSON string

```javascript
world.fromJson(data)

entity.fromJson(data)

entity.get('position').fromJson(data)
```

#### Prototypes

##### Register a prototype

```javascript
world.prototype('Player', {
	position: {},
	velocity: {},
	sprite: {
		texture: 'player.png'
	}
})
```

##### Register prototypes from a string

```javascript
let data = '{"Player": {"position": {}, "sprite": {"texture": "player.png"}}}'

world.prototypes(data)
```

##### Create an entity from a prototype

```javascript
world.entity('Player')
```

#### Iterate over entities

##### Iterate through entities from component names

This works exactly the same as systems, and is actually used internally to run the every() method on systems.

```javascript
world.every(['position', 'velocity'], (position, velocity, ent) => {
	position.x += velocity.x
	position.y += velocity.y
})
```

##### Component query rules for every()

* AND logic - without exact matching
* Above query **does** include entities such as ['position', 'velocity', 'sprite']
* Above query **does not** include entities such as ['position', 'sprite']


### Author
Eric Hebert

### License
MIT
