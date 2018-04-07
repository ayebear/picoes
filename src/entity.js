/** @ignore */
const { invoke } = require('./utilities.js')

// Entity class used internally for keeping track of components
class Entity {
	constructor(world, id) {
		this.world = world
		this.id = id
		this.data = {}

		// Add to the index, to update match all index
		if (this.valid()) {
			this.world.index.add(this)
		}
	}

	// Returns true if the entity has ALL of the specified components
	has(...components) {
		return components.every(name => name in this.data)
	}

	// Returns a component by name (returns undefined if it doesn't exist)
	// entity.get('position')
	get(component) {
		return this.data[component]
	}

	// Returns a component by name (automatically created if it doesn't exist)
	// entity.access('position')
	access(component, ...args) {
		if (!this.has(component)) {
			this.set(component, ...args)
		}
		return this.data[component]
	}

	// Adds a new component, or overwrites an existing component
	// entity.set('position', 1, 2)
	set(component, ...args) {
		if (this.valid() && component in this.world.components) {
			// Use defined component template, passing entity as first parameter
			this.data[component] = new this.world.components[component](this, ...args)
		} else if (args.length > 0) {
			// Use first argument as component value
			this.data[component] = args[0]
		} else {
			// Make an empty object
			this.data[component] = {}
		}

		// Update the index with this new component
		if (this.valid()) {
			this.world.index.add(this, component)
		}

		return this
	}

	// Updates component data from an object or other component
	// Note: Works with setters too
	// entity.update('position', {x: 1, y: 2})
	update(component, data) {
		let comp = this.access(component)

		// Shallow set keys of the component
		for (let key in data) {
			comp[key] = data[key]
		}

		return this
	}

	// Removes a component from the entity (no effect when it doesn't exist)
	// Can specify an onRemove() method in your component which gets called before it is removed
	// entity.remove('position')
	remove(...components) {
		for (let component of components) {
			if (component in this.data) {

				if (this.valid()) {
					this.world.index.remove(this, component)
				}

				// Call custom onRemove
				invoke(this.data[component], 'onRemove')

				delete this.data[component]
			}
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
		this.removeAll()

		if (this.valid()) {
			// Remove from the index, to update match all index
			this.world.index.remove(this)

			// Remove from world
			delete this.world.entities[this.id]
			this.id = undefined
		}
	}

	// Returns true if this is a valid, existing, and usable entity
	valid() {
		return this.world && this.id !== undefined
	}

	// Returns unique entity ID as a string
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

	// Attaches a currently detached entity back to a world
	// Note: Do not use detached entities, get() may be safe, but avoid calling other methods
	// Note: The ID will be reassigned, so do not rely on this
	attach(world) {
		if (world && !this.valid()) {
			// Assign new id, and reattach to world
			this.world = world
			this.id = this.world.idCounter++
			this.world.entities[this.id] = this
			this.world.index.addEntity(this)
		}
	}

	// Removes this entity from the current world, without removing any components or data
	// Note: Do not use detached entities, get() may be safe, but avoid calling other methods
	// Note: The ID will be reassigned, so do not rely on this
	detach() {
		if (this.valid()) {
			// Remove from current world
			this.world.index.removeEntity(this)
			delete this.world.entities[this.id]
			this.id = undefined
			this.world = undefined
		}
	}
}

exports.Entity = Entity
