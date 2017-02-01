let Entity = require('./entity.js').Entity
let Index = require('./index.js').Index

function isFunction(obj) {
	return typeof obj === 'function'
}

class World {
	constructor() {
		this.systems = []
		this.entities = {}
		this.components = {}
		this.entityTemplates = {}

		this.idCounter = 1

		// Maps entire queries to arrays of entities
		this.index = new Index(this.entities)
	}

	// Removes all entities from the world
	// Does not affect registered systems, components, or prototypes
	clear() {
		this.entities = {}
		this.index.clear(this.entities)
	}

	// Registers a component type to the world
	// Note: Must be either a function or an object (nothing specified is allowed as well)
	// world.component(class { constructor(a) {this.a = a} })
	component(name, componentClass) {
		// Convert objects to strings for faster duplication later on
		if (typeof componentClass === 'object') {
			componentClass = JSON.stringify(componentClass)
		}

		// Must be one of the three supported types
		let type = typeof componentClass
		if (type === 'function' || type === 'string' || type === 'undefined') {
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
				system.init.call(system)
			}
		}
	}

	// Calls pre, every, and post on all systems
	run() {
		for (let system of this.systems) {
			if (isFunction(system.pre)) {
				system.pre.call(system)
			}

			// Run the "every" method in the system
			if (isFunction(system.every)) {
				this.every(system.components, system.every, system)
			}

			if (isFunction(system.post)) {
				system.post.call(system)
			}
		}
	}

	// Iterate through entities with the specified components
	// world.every(['comp'], comp => {comp.value = 0})
	// Get an iterator for the entities
	// let it = world.every(['comp'])
	every(componentNames, callback, that) {
		// Get indexed map of entities
		let entities = this.index.query(componentNames)

		if (isFunction(callback)) {
			// Go through the map of entities
			for (let ent of entities.values()) {

				// Ensure entity has all of these components by this point
				if (ent.has(...componentNames)) {

					// Get all components as an array
					let comps = componentNames.map(name => ent.get(name))

					// Add entity itself as the last parameter
					comps.push(ent)

					// Expand array as parameters to the method
					if (that === undefined) {
						callback(...comps)
					} else {
						callback.call(that, ...comps)
					}
				}
			}
		}

		return entities.values()
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
		if (typeof data === 'object') {
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
}

exports.World = World
