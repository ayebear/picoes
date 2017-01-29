// Entity class used internally for keeping track of components
class Entity {
	constructor(world, id) {
		this.world = world
		this.id = id
		this.data = {}

		this.world.index.add(this)
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
		} else if (templateType === 'string') {
			this.data[component] = JSON.parse(compTemplate)
		} else if (templateType === 'undefined' && args.length > 0) {
			this.data[component] = args[0]
		} else {
			this.data[component] = {}
		}

		this.world.index.add(this, component)

		return this
	}

	// Updates component data from an object or other component
	// ent.update('position', {x: 1, y: 2})
	update(component, data) {
		let comp = this.access(component)

		// Shallow copy properties of component
		for (let key in data) {
			comp[key] = data[key]
		}

		return this
	}

	// Removes a component from the entity (no effect when it doesn't exist)
	// Can specify an onRemove() method in your component which gets called before it is removed
	// ent.remove('position')
	remove(component) {
		if (component in this.data) {

			this.world.index.remove(this, component)

			let comp = this.data[component]
			if (typeof comp.onRemove === 'function') {
				comp.onRemove()
			}
			delete this.data[component]
		}
		return this
	}

	// Remove all components
	removeAll() {
		for (let compName in this.data) {
			this.remove(compName)
		}
		this.data = {}
	}

	// Remove this entity and all of its components from the world
	destroy() {
		if (this.id) {
			this.removeAll()
			this.world.index.remove(this)
			delete this.world.entities[this.id]
			this.id = undefined
		}
	}

	// Returns true if this is a valid, existing, and usable entity
	valid() {
		return this.world && this.id !== undefined
	}

	toString() {
		return String(this.id)
	}

	// Serializes entire entity to JSON
	// Note: Defining toJSON methods in your components will override the built-in behavior
	toJSON() {
		return JSON.stringify(this.data)
	}

	// Deserializes data from JSON, creating new components
	// Note: Defining fromJSON methods in your components will override the built-in behavior
	fromJSON(data) {
		let parsed = JSON.parse(data)
		for (let name in parsed) {
			let comp = this.access(name)

			// Either call custom method or copy all properties
			if (typeof comp.fromJSON === 'function') {
				comp.fromJSON(parsed[name])
			} else {
				this.update(name, parsed[name])
			}
		}
		return this
	}
}

exports.Entity = Entity
