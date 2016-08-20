function isFunction(obj) {
	return typeof obj === 'function'
}

function isObject(obj) {
	return typeof obj === 'object'
}

// TODO: Figure out a better solution for component templates and prototypes
function clone(obj) {
	return JSON.parse(JSON.stringify(obj))
}

class Entity {
	constructor(world, id) {
		this.world = world
		this.id = id
		this.data = {}
	}

	// Returns true if the entity has ALL of the specified components
	has(...args) {
		let comps = [...args]
		return comps.every((name) => {
			return name in this.data
		})
	}

	// Returns a component by name (returns undefined if it doesn't exist)
	// ent.get('position')
	get(component) {
		if (this.has(component)) {
			return this.data[component]
		}
		return undefined
	}

	// Returns a component by name (automatically created if it doesn't exist)
	// ent.access('position')
	access(component) {
		if (!this.has(component)) {
			this.set(component)
		}
		return this.data[component]
	}

	// Adds a new component, or overwrites an existing component
	// ent.set('position', 1, 2)
	set(component, ...args) {
		let compTemplate = this.world.components[component]
		let templateType = typeof compTemplate
		if (templateType === 'function') {
			this.data[component] = new compTemplate(...args)
		} else if (templateType === 'object') {
			this.data[component] = clone(compTemplate)
		} else {
			this.data[component] = {}
		}
		return this
	}

	// Updates component data from an object or other component
	// ent.update('position', {x: 1, y: 2})
	update(component, data) {
		let comp = this.access(component)
		for (let key in data) {
			comp[key] = data[key]
		}
		return this
	}

	// Removes a component from the entity (no effect when it doesn't exist)
	// ent.remove('position')
	remove(component) {
		delete this.data[component]
		return this
	}

	// Remove all components
	removeAll() {
		this.data = {}
	}

	// Remove this entity and all of its components from the world
	destroy() {
		if (this.id) {
			this.removeAll()
			delete this.world.entities[this.id]
			this.id = undefined
		}
	}

	// Returns true if this is a valid, existing, and usable entity
	valid() {
		return this.world && this.id !== undefined
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
			this.update(name, parsed[name])
		}
	}
}

class World {
	constructor() {
		this.systems = []
		this.entities = {}
		this.components = {}

		/*
		Entity templates:
		{
			"Player": {
				"Position": '{"x": 0, "y": 0}',
				"Health": '{"value": 100}'
			},
			"Enemy": {...},
			...
		}
		*/
		this.entityTemplates = {}

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

	// Registers a component type to the world
	// Note: Must be either a function or an object (nothing specified is allowed as well)
	// world.component(class { constructor(a) {this.a = a} })
	component(name, componentClass) {
		let type = typeof componentClass
		if (type === 'function' || type === 'object' || type === 'undefined') {
			this.components[name] = componentClass
			return name
		}
		return undefined
	}

	// Creates a new entity in the world
	// world.entity()
	// or world.entity('Player')
	entity(name) {
		let entId = this.idCounter++
		let ent = new Entity(this, entId)

		// Use 'name' to get prototype data (if specified)
		if (name && name in this.entityTemplates) {
			// Add all components from prototype
			let template = this.entityTemplates[name]
			for (let componentName in template) {
				// Update component with data from template
				let newComponentData = JSON.parse(template[componentName])
				ent.update(componentName, newComponentData)
			}
		}

		this.entities[entId] = ent
		return ent
	}

	// Registers a system to the world
	// Returns its unique ID on success or undefined on failure
	// world.system(class { every(ent) {} })
	system(components, systemClass) {
		if (isFunction(systemClass)) {
			let newSystem = new systemClass()
			newSystem.components = components
			this.systems.push(newSystem)
			return this.systems.length - 1
		}
		return undefined
	}

	// Calls init() on all systems
	init() {
		for (let system of this.systems) {
			if (isFunction(system.init)) {
				system.init()
			}
		}
	}

	// Calls pre, every, and post on all systems
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

	// Iterate through entities with the specified components
	// world.every(['comp'], comp => {comp.value = 0})
	every(componentNames, callback) {
		// First, get a list of entities (fixes problems with adding new ones during the loop)
		let entities = this.query(componentNames)

		// Go through this list of entities
		for (let ent of entities) {
			// Get all components as an array
			let comps = componentNames.map(name => ent.get(name))

			// Add entity itself as the last parameter
			comps.push(ent)

			// If all components are defined
			if (comps.every(i => i)) {
				// Expand array as parameters to the method
				callback(...comps)
			}
		}
	}

	// Registers entity prototype(s)
	// Must be either a string or an object
	// Top level must be prototype names
	// Note: Any existing prototype names that are the same will be overwritten
	// Returns number of prototypes added
	prototype(data) {
		let count = 0

		// Convert to an object when given a string
		if (typeof data === 'string') {
			data = JSON.parse(data)
		}

		// Data must be an object at this point
		if (isObject(data)) {
			// Iterate through prototype names
			for (let protoName in data) {
				let inputObject = data[protoName]
				let protoObject = {}
				// Iterate through component names
				for (let compName in inputObject) {
					// Store strings of each component
					protoObject[compName] = JSON.stringify(inputObject[compName])
				}
				this.entityTemplates[protoName] = protoObject
				++count
			}
		}

		return count
	}

	// Warning: Internal use only, use at your own risk
	// Builds an array of entities based on the specified components
	// let entities = world.query(['position', 'velocity'])
	query(componentNames) {
		// TODO: Use some kind of a reverse index to make this closer to O(1)
		let results = []
		for (let entId in this.entities) {
			let ent = this.entities[entId]

			// Ensure entity contains all specified components
			if (ent.has(...componentNames)) {
				// Add entity to search results
				results.push(ent)
			}
		}
		return results
	}
}

exports.World = World
