function isFunction(obj) {
	return typeof obj === 'function'
}

function isObject(obj) {
	return typeof obj === 'object'
}

class Entity {
	constructor(world) {
		this.world = world
		this.data = {}
	}

	get(component) {
		if (!this.has(component)) {
			this.set(component)
		}
		return this.data[component]
	}

	// Adds or overwrites a new component
	// ent.set('position', 1, 2)
	set(component, ...args) {
		let objType = this.world.components[component]
		this.data[component] = new objType(...args)
		return this
	}

	// Updates data from existing component (and creates a new one first if necessary)
	// ent.merge('position', {x: 1, y: 2})
	merge(component, data) {

		return this
	}

	// Removes a component from the entity (no effect when it doesn't exist)
	// ent.remove('position')
	// Also can remove all components: ent.remove()
	remove(component) {
		if (component === undefined) {
			// Remove all
			this.data = {}
		} else if (component.length > 0) {
			// Remove component
			delete this.data[component]
		}
		return this
	}

	// Checks if a component exists
	has(component) {
		return component in this.data
	}

	// Serializes entire entity to JSON
	toJson() {

	}

	// Deserializes data from JSON, creating new components
	fromJson(data) {

	}
}

class World {
	constructor() {
		this.systems = []
		this.entities = {}
		this.components = {}

		this.idCounter = 0
	}

	// world.component(class { constructor(a) {this.a = a} })
	component(name, componentClass) {
		this.components[name] = componentClass
	}

	// world.entity()
	// or world.entity('Player')
	entity(name) {
		let entId = this.idCounter++
		let ent = new Entity(this)

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
			if ('init' in system) {
				system.init()
			}
		}
	}

	// world.run()
	run() {
		for (let system of this.systems) {
			if ('pre' in system) {
				system.pre()
			}

			if ('every' in system) {
				let entities = this.query(system.components)
				for (let ent of entities) {
					// TODO: Pass all components dynamically as parameters or an array or something
					system.every(ent)
				}
			}

			if ('post' in system) {
				system.post()
			}
		}
	}

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

	prototype(name, data) {
		console.log('Warning: Prototypes are not implemented yet')
	}

	prototypes(data) {
		let parsed = JSON.parse(data)
		for (let name in parsed) {
			this.prototype(name, parsed[name])
		}
	}
}

exports.World = World
