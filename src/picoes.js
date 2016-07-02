function isFunction(obj) {
	return typeof obj === 'function'
}

function isObject(obj) {
	return typeof obj === 'object'
}

function isPrimitive(obj) {
	return (typeof obj === 'boolean') || (typeof obj === 'number') || (typeof obj === 'string')
}

// TODO: Figure out a better solution for component templates and prototypes
function clone(obj) {
	if (isPrimitive(obj)) {
		return obj
	}
	return JSON.parse(JSON.stringify(obj))
}

class Entity {
	constructor(world, id) {
		this.world = world
		this.id = id
		this.data = {}
	}

	// Checks if a component exists
	has(component) {
		return component in this.data
	}

	// Returns a component by name
	// ent.get('position')
	get(component) {
		if (!this.has(component)) {
			this.set(component)
		}
		return this.data[component]
	}

	// Adds or overwrites a new component
	// ent.set('position', 1, 2)
	set(component, ...args) {
		let compTemplate = this.world.components[component]
		if (isFunction(compTemplate)) {
			this.data[component] = new compTemplate(...args)
		} else if (isObject(compTemplate)) {
			this.data[component] = clone(compTemplate)
		} else {
			this.data[component] = {}
		}
		return this
	}

	// Updates data from existing component (and creates a new one first if necessary)
	// ent.merge('position', {x: 1, y: 2})
	merge(component, data) {
		let comp = this.get(component)
		for (let key in data) {
			comp[key] = data[key]
		}
		return this
	}

	// Removes a component from the entity (no effect when it doesn't exist)
	// ent.remove('position')
	// Also can remove all components: ent.remove()
	// TODO: Maybe split into removeAll, seems dangerous
	remove(component) {
		if (component === undefined) {
			// Remove all
			this.data = {}
		} else if (component in this.data) {
			// Remove component
			delete this.data[component]
		}
		return this
	}

	// Remove this entity and all of its components from the world
	destroy() {
		if (this.entId) {
			this.remove()
			delete this.world.entities[this.entId]
			this.entId = null
		}
	}

	// Serializes entire entity to JSON
	toJson() {
		// TODO: Allow for custom recursive toJson methods
		return JSON.stringify(this.data)
	}

	// Deserializes data from JSON, creating new components
	fromJson(data) {
		let parsed = JSON.parse(data)
		for (let name in parsed) {
			this.merge(name, parsed[name])
		}
	}
}

class World {
	constructor() {
		this.systems = []
		this.entities = {}
		this.components = {}

		this.idCounter = 1

		// Maps component names to sets of entity IDs which contain those components
		this.index = {}
		/*
		{
			position: [1, 5, 6, 19],
			velocity: [6, 19],
			sprite: [19, 20],
		}

		Querying could use the minimum length array, and only iterate through those entities,
			then check if each of those have all of the specified components.
		*/
	}

	// world.component(class { constructor(a) {this.a = a} })
	component(name, componentClass) {
		this.components[name] = componentClass
	}

	// world.entity()
	// or world.entity('Player')
	entity(name) {
		let entId = this.idCounter++
		let ent = new Entity(this, entId)

		// TODO: Use 'name' to get prototype data

		this.entities[entId] = ent
		return ent
	}

	// world.system(class { every(ent) {} })
	system(components, systemClass) {
		let newSystem = new systemClass()
		newSystem.components = components
		this.systems.push(newSystem)
	}

	init() {
		for (let system of this.systems) {
			if (isFunction(system.init)) {
				system.init()
			}
		}
	}

	// world.run()
	run() {
		for (let system of this.systems) {
			if (isFunction(system.pre)) {
				system.pre()
			}

			// Run the "every" method in the system
			if (isFunction(system.every)) {
				this.every(system.components, system.every)
			}

			if (isFunction(system.post)) {
				system.post()
			}
		}
	}

	// world.every(['comp'], comp => {comp.value = 0})
	every(componentNames, callback) {
		// First, get a list of entities (fixes problems with adding new ones during the loop)
		let entities = this.query(componentNames)

		// Go through this list of entities
		for (let ent of entities) {
			// Get all components as an array
			let comps = componentNames.map(name => ent.get(name))

			// If all components are defined
			if (comps.every(i => i)) {
				// Expand array as parameters to the method
				callback(...comps)
			}
		}
	}

	prototype(name, data) {
		console.log('Warning: Prototypes are not implemented yet')
	}

	prototypes(data) {
		let parsed = JSON.parse(data)
		for (let name in parsed) {
			this.prototype(name, parsed[name])
		}
	}

	// Warning: Internal use only, use at your own risk
	// Builds an array of entities based on the specified components
	// let entities = world.query(['position', 'velocity'])
	query(componentNames) {
		// TODO: Use some kind of a reverse index to make this closer to O(1)
		let entities = []
		for (let entId in this.entities) {
			let ent = this.entities[entId]

			// Ensure entity contains all specified components
			let i = 0
			let exists = true
			while (i < componentNames.length && exists) {
				exists = ent.has(componentNames[i])
				++i
			}

			// Add entity to search results
			if (exists) {
				entities.push(ent)
			}
		}
		return entities
	}
}

exports.World = World
