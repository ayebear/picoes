// TODO: Figure out a better solution for component templates and prototypes
function clone(obj) {
	return JSON.parse(JSON.stringify(obj))
}

// Entity class used internally for keeping track of components
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

exports.Entity = Entity
