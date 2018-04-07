/** @ignore */
const { invoke } = require('./utilities.js')

/**
 * Entity class used for storing components.
 *
 * @class      Entity (name)
 */
class Entity {
	/**
	 * Do not construct an Entity yourself - use the entity() method in World instead.
	 * Also, do not shallow/deep copy entity objects, only pass around references.
	 *
	 * @private
	 *
	 * @param {World}  world - The world
	 * @param {number} id    - The identifier
	 */
	constructor(world, id) {
		/** @ignore */
		this.world = world

		/** @ignore */
		this._id = id

		/** @ignore */
		this.data = {}

		// Add to the index, to update match all index
		if (this.valid()) {
			this.world.index.add(this)
		}
	}

	/**
	 * Return the entity ID.
	 *
	 * @return {number} Integer entity ID
	 */
	get id() {
		return this._id
	}

	/**
	 * ID is read-only, attempting to set it will throw an error.
	 *
	 * @private
	 */
	set id(id) {
		throw new Error('Cannot set entity id')
	}

	/**
	 * Returns true if the entity has ALL of the specified component names.
	 * Additional components that the entity has, which are not specified in has(), will be ignored.
	 * If no component names are specified, this method returns true.
	 *
	 * @example
	 * if (entity.has('position', 'velocity')) {...}
	 *
	 * @param {...string} [components] - The component names to check for
	 *
	 * @return {boolean} true or false
	 */
	has(...components) {
		return components.every(name => name in this.data)
	}

	/**
	 * Returns a component by name, or undefined if it doesn't exist
	 *
	 * @example
	 * let position = entity.get('position')
	 *
	 * @param {string} component - The component name to get
	 *
	 * @return {Object} The component if defined, otherwise undefined
	 */
	get(component) {
		return this.data[component]
	}

	/**
	 * Returns a component by name (automatically created if it doesn't exist)
	 *
	 * @example
	 * let position = entity.access('position', 3, 4)
	 *
	 * @param {string}    component - The component name to create/get
	 * @param {...Object} [args]    - The arguments to forward to create the new component, only if it doesn't exist.
	 *
	 * @return {Object} Always returns either the existing component, or the newly created one.
	 */
	access(component, ...args) {
		if (!this.has(component)) {
			this.set(component, ...args)
		}
		return this.data[component]
	}

	/**
	 * Adds a new component, or re-creates and overwrites an existing component
	 *
	 * @example
	 * entity.set('position', 1, 2)
	 *
	 * @example
	 * entity.set('anonymousComponent', { keys: 'values' })
	 *
	 * @example
	 * entity.set('anotherAnonymousComponent', 'Any type of any value')
	 *
	 * @param {string}    component - The component name to create. If there is a registered component for this name, then
	 * its constructor will be called and an object of that type will be created.
	 * @param {...Object} [args]    - The arguments to forward to the registered component type. If the component type is
	 * registered, then only the first additional argument will be used as the value of the entire component.
	 *
	 * @return {Object} The original entity that set() was called on, so that operations can be chained.
	 */
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

	/**
	 * Updates component data from an object or other component. Similar to access() with a shallow merge applied after.
	 *
	 * @example
	 * entity.update('position', { x: 1, y: 2 })
	 *
	 * @param {string} component - The component name to update
	 * @param {Object} data      - The object or other component to merge into the specified component.
	 *
	 * @return {Object} The original entity that update() was called on, so that operations can be chained.
	 */
	update(component, data) {
		let comp = this.access(component)

		// Shallow set keys of the component
		for (let key in data) {
			comp[key] = data[key]
		}

		return this
	}

	/**
	 * Removes a component from the entity - has no effect when it doesn't exist.
	 * Can specify an onRemove() method in your component which gets called before it is removed.
	 * If nothing is specified, then nothing will be removed. Use removeAll() to remove all components.
	 *
	 * @example
	 * entity.remove('position')
	 *
	 * @param {...string} [components] - The component names to remove from the entity.
	 *
	 * @return {Object} The original entity that remove() was called on, so that operations can be chained.
	 */
	remove(...components) {
		for (let component of components) {
			if (component in this.data) {

				// Remove from index
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

	/**
	 * Removes all components from the entity.
	 *
	 * @example
	 * entity.removeAll()
	 *
	 * @return {Object} The original entity that removeAll() was called on, so that operations can be chained.
	 */
	removeAll() {
		this.remove(...Object.keys(this.data))
		this.data = {}
		return this
	}

	/**
	 * Remove this entity and all of its components from the world. After an entity is destroyed, the object should be discarded,
	 * and it is recommended to avoid re-using it.
	 *
	 * @example
	 * entity.destroy()
	 */
	destroy() {
		this.removeAll()

		if (this.valid()) {
			// Remove from the index, to update match all index
			this.world.index.remove(this)

			// Remove from world
			delete this.world.entities[this._id]
			this._id = undefined
		}
	}

	/**
	 * Returns true if this is a valid, existing, and usable entity, which is attached to a world.
	 *
	 * @example
	 * if (entity.valid()) {...}
	 *
	 * @return {boolean} true or false
	 */
	valid() {
		// Note: No need to actually look in the world for the ID, if entities are only ever copied by reference.
		// If entities are ever deep/shallow copied, this function will need to check this to be more robust.
		return this.world && this._id !== undefined
	}

	/**
	 * Returns unique entity ID as a string.
	 *
	 * @example
	 * let entityId = entity.toString()
	 *
	 * @return {string} String representation of the entity ID.
	 */
	toString() {
		return String(this._id)
	}

	/**
	 * Serializes entire entity and components to JSON.
	 * Note: Defining toJSON methods in your components will override the built-in behavior.
	 *
	 * @example
	 * let serializedEntity = entity.toJSON()
	 *
	 * @return {string} JSON encoded string
	 */
	toJSON() {
		return JSON.stringify(this.data)
	}

	/**
	 * Deserializes data from JSON, creating new components and overwriting existing components.
	 * Note: Defining fromJSON methods in your components will override the built-in behavior.
	 *
	 * @example
	 * entity.fromJSON(serializedEntity)
	 *
	 * @param {string} data - A JSON string containing component data to parse, and store in this entity.
	 *
	 * @return {Object} The original entity that fromJSON() was called on, so that operations can be chained.
	 */
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

	/**
	 * Attaches a currently detached entity back to a world.
	 * Note: Do not use detached entities, get() may be safe, but avoid calling other methods
	 * Note: The ID will be reassigned, so do not rely on this
	 *
	 * @example
	 * entity.attach(world)
	 *
	 * @param {World} world - The world to attach this entity to
	 */
	attach(world) {
		if (world && !this.valid()) {
			// Assign new id, and reattach to world
			this.world = world
			this._id = this.world.idCounter++
			this.world.entities[this._id] = this
			this.world.index.addEntity(this)
		}
	}

	/**
	 * Removes this entity from the current world, without removing any components or data.
	 * It can be re-attached to another world (or the same world), using the attach() method.
	 * Note: Do not use detached entities, get() may be safe, but avoid calling other methods
	 * Note: The ID will be reassigned, so do not rely on this
	 *
	 * @example
	 * entity.detach()
	 */
	detach() {
		if (this.valid()) {
			// Remove from current world
			this.world.index.removeEntity(this)
			delete this.world.entities[this._id]
			this._id = undefined
			this.world = undefined
		}
	}
}

exports.Entity = Entity
