/** @ignore */
const { invoke } = require('./utilities.js')

/** @ignore */
const { Entity } = require('./entity.js')

/** @ignore */
const { ComponentIndex } = require('./component_index.js')

/**
 * Determines if function.
 *
 * @ignore
 */
function isFunction(obj) {
	return typeof obj === 'function'
}

/**
 * Class for world.
 *
 * @class      World (name)
 */
class World {
	/**
	 * Constructs an instance of the world.
	 */
	constructor() {
		/** @private */
		this.systems = []
		/** @private */
		this.entities = {}
		/** @private */
		this.components = {}
		/** @private */
		this.entityTemplates = {}

		/** @private */
		this.idCounter = 1

		/**
		 * Maps entire queries to arrays of entities
		 * @private
		 */
		this.index = new ComponentIndex(this.entities)
	}

	/**
	 * Removes all entities from the world
	 *
	 * Does not affect registered systems, components, or prototypes
	 */
	clear() {
		// Call onRemove on all components of all entities
		for (let entityId in this.entities) {
			let entity = this.entities[entityId]
			for (let componentName in entity.data) {
				// Get component, and call onRemove if it exists as a function
				let component = entity.data[componentName]
				if (isFunction(component.onRemove)) {
					component.onRemove()
				}
			}
		}

		// Clear entities
		this.entities = {}
		this.index.clear(this.entities)
	}

	/**
	 * Registers a component type to the world
	 *
	 * @param {string}   name           - The name
	 * @param {function} componentClass - The component class, must be a constructable class or function
	 *
	 * @example
	 * world.component(class {
	 *     constructor(entity, ...args) {
	 *         this.entity = entity
	 *     }
	 * })
	 *
	 * @return {string} Registered component name on success, undefined on failure
	 */
	component(name, componentClass) {
		// Only allow functions and classes to be components
		if (isFunction(componentClass)) {
			this.components[name] = componentClass
			return name
		}
	}

	/**
	 * Creates a new entity in the world
	 *
	 * @param {string} [name] - The prototype name to use
	 *
	 * @example
	 * world.entity()
	 *
	 * @example
	 * world.entity('Player')
	 *
	 * @return {Entity} The new entity created
	 */
	entity(name) {
		let entId = this.idCounter++
		let entity = new Entity(this, entId)

		// Use 'name' to get prototype data (if specified)
		if (name && name in this.entityTemplates) {
			// Add all components from prototype
			let template = this.entityTemplates[name]
			for (let componentName in template) {
				// Update component with data from template
				let newComponentData = JSON.parse(template[componentName])
				entity.update(componentName, newComponentData)
			}
		}

		this.entities[entId] = entity
		return entity
	}

	/**
	 * Registers a system to the world
	 *
	 * @example
	 * // Movement system
	 * world.system(['position', 'velocity'], class {
	 *      every(position, velocity, entity) {
	 *          position.x += velocity.x
	 *          position.y += velocity.y
	 *      }
	 *  })
	 *
	 * @param {Array}     components  - The list of components the system will process in every(). This follows the same logic as entity.has() and world.every().
	 * @param {Function}  systemClass - The system class to instantiate. Can contain the following methods: constructor, initialize,
	 * pre, every, post. Pre() and post() get called before and after every(), for each of the independent systems. See world.run()
	 * for an example of the call order.
	 * @param {...Object} [args]      - The arguments to forward to the system's constructors
	 *
	 * @return {number} Unique ID of the system on success or undefined on failure
	 */
	system(components, systemClass, ...args) {
		if (isFunction(systemClass)) {
			// Create the system, and set the component array query
			let newSystem = new systemClass(...args)
			newSystem.components = components

			// Add the system, return its ID
			return this.systems.push(newSystem) - 1
		}
		return undefined
	}

	/**
	 * Calls initialize() on all systems
	 *
	 * @example
	 * world.initialize(renderContext)
	 *
	 * @param {...Object} [args] - The arguments to forward to the systems' initialize() methods
	 */
	initialize(...args) {
		for (let system of this.systems) {
			invoke(system, 'initialize', ...args)
		}
	}

	/**
	 * Calls pre(), every(), and post() on all systems
	 *
	 * @example
	 * world.run(deltaTime)
	 *
	 * @example
	 * // Example flow of method call order given systemA and systemB:
	 * // During world.run():
	 * // systemA.pre()
	 * // systemA.every() * number of entities
	 * // systemA.post()
	 * // systemB.pre()
	 * // systemB.every() * number of entities
	 * // systemB.post()
	 *
	 * @param {...Object} [args] - The arguments to forward to the systems' methods
	 */
	run(...args) {
		for (let system of this.systems) {
			invoke(system, 'pre', ...args)

			// Run the "every" method in the system
			if (isFunction(system.every)) {
				this.every(system.components, system.every.bind(system), ...args)
			}

			invoke(system, 'post', ...args)
		}
	}

	/**
	 * Iterate through entities with the specified components
	 *
	 * @example
	 * // Use a callback to process entities one-by-one
	 * world.every(['comp'], comp => {comp.value = 0})
	 *
	 * @example
	 * // Get an iterator for the entities
	 * let it = world.every(['comp'])
	 * for (let entity of it) {...}
	 *
	 * @param {Array}     componentNames - The component names to match entites with. This checks if the entity
	 * has ALL of the specified components, but does not check for additional components.
	 * @param {Function}  callback       - The callback to call for each entity. Takes (...components, entity, ...args).
	 * @param {...Object} [args]         - Any additional arguments to pass to the callback.
	 *
	 * @return {MapIterator} An iterator to the entities themselves
	 */
	every(componentNames, callback, ...args) {
		// Get indexed map of entities
		let entities = this.index.query(componentNames)

		if (isFunction(callback)) {
			// Go through the map of entities
			for (let entity of entities.values()) {
				// At this point, we can safely assume that all components exist, even if entities/components
				// are deleted/modified during the loop, because JavaScript's MapIterator is smart enough.

				// Get all components as an array
				let components = componentNames.map(name => entity.get(name))

				// Pass components, then the main entity, then any additional arguments
				let status = callback(...components, entity, ...args)

				// Stop the iteration when the callback returns false
				if (status === false) {
					break
				}
			}
		}

		return entities.values()
	}

	/**
	 * Returns an array of entities with matching components
	 * Simplified version of every(), returns an actual array, and only takes component names as arguments.
	 *
	 * @example
	 * world.get('player', 'sprite')
	 *
	 * @param {Array} componentNames - The component names to match on. See every() for how this matches.
	 *
	 * @return {Array} Array of entities, instead of iterator like every().
	 */
	get(...componentNames) {
		return [...this.every(componentNames)]
	}

	/**
	 * Registers entity prototype(s). Any existing prototype names that are the same will be overwritten
	 *
	 * @example
	 * world.prototype({
	 *     Movable: {
	 *         position: {},
	 *         velocity: {}
	 *     }
	 * })
	 *
	 * @param {Object} data - Object structure to register as a prototype. Should be a dictionary with the top level keys
	 * being the prototype names. Can also be a JSON formatted string.
	 *
	 * @return {number} Number of prototypes added.
	 */
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
