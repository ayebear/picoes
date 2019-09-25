/** @ignore */
const { invoke, isFunction } = require('./utilities.js')

/** @ignore */
const { Entity } = require('./entity.js')

/** @ignore */
const { SimpleIndex } = require('./simple_index.js')

/**
 * Class for world.
 *
 * @class      World (name)
 */
class World {
	/**
	 * Constructs an instance of the world.
	 *
	 * @param      {Function}  [indexer=SimpleIndex]  The indexer to use. Default is SimpleIndex. Can use MemoizedQueryIndex if better querying performance is needed, for increased component creation/removal costs.
	 */
	constructor(indexer = SimpleIndex) {
		/** @ignore */
		this.systems = []

		/**
		 * Maps entity IDs to entities
		 * @ignore
		 */
		this.entities = new Map()

		/** @ignore */
		this.components = {}

		/** @ignore */
		this.entityTemplates = {}

		/** @ignore */
		this.idCounter = 1

		/**
		 * Maps entire queries to arrays of entities
		 * @ignore
		 */
		this.index = new indexer(this)
	}

	/**
	 * Removes all entities from the world.
	 * Does not affect registered systems, components, or prototypes.
	 *
	 * @example
	 * world.clear()
	 */
	clear() {
		// Call onRemove on all components of all entities
		for (const [entityId, entity] of this.entities) {
			for (let componentName in entity.data) {
				// Get component, and call onRemove if it exists as a function
				let component = entity.data[componentName]
				invoke(component, 'onRemove')
			}
		}

		// Clear entities
		this.entities = new Map()
		this.index.clear()
	}

	/**
	 * Registers a component type to the world. Components must be constructable. If the component has an onCreate(),
	 * it is passed the entity first, then the rest of the arguments from methods like entity.set(). Also, components
	 * can have an onRemove() method, which gets called when removing that component from an entity.
	 *
	 * @param {string}   name           - The name
	 * @param {function} componentClass - The component class, must be a constructable class or function
	 *
	 * @example
	 * world.component('myComponent', class {
	 *     // It is highly recommended to use onCreate() over constructor(), because the component
	 *     // will have already been added to the entity. In the constructor(), it is not safe to use
	 *     // "entity" because it does not contain the current component while still in the constructor.
	 *     onCreate(entity, some, args) {
	 *         this.entity = entity
	 *         this.some = some
	 *         this.args = args
	 *     }
	 * })
	 * // entity === the new entity object
	 * // some === 10
	 * // args === 500
	 * world.entity().set('myComponent', 10, 500)
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
		let entityId = this.idCounter++
		let entity = new Entity(this, entityId)

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

		this.entities.set(entityId, entity)
		return entity
	}

	/**
	 * Registers a system to the world.
	 * The order the systems get registered, is the order then run in.
	 *
	 * @example
	 * // Movement system
	 * world.system(['position', 'velocity'], class {
	 *      constructor(context) {
	 *          // This is showing how you can optionally pass parameters to the system's constructor
	 *          this.context = context
	 *      }
	 *      every(position, velocity, entity) {
	 *          position.x += velocity.x
	 *          position.y += velocity.y
	 *      }
	 *  }, context)
	 *
	 * @example
	 * // System that doesn't use every()
	 * world.system(class {
	 *      constructor(context) {
	 *          this.context = context
	 *      }
	 *      pre() {
	 *          // Handle events or something
	 *      }
	 *  }, context)
	 *
	 * @param {...Object} args - Both signatures are accepted: (components, systemClass, ...args) or (systemClass, ...args).
	 *
	 * **[components]**: The list of components the system will process in every(). This follows the same logic as entity.has() and world.every().
	 *
	 * **{systemClass}**: The system class to instantiate. Can contain the following methods: constructor, initialize, pre, every, post. Pre() and post() get called before and after every(), for each of the independent systems. See world.run() for an example of the call order.
	 *
	 * **[...args]**: The arguments to forward to the system's constructors.
	 *
	 * @return {number} Unique ID of the system on success or undefined on failure
	 */
	system(...args) {
		// Get components and systemClass from arguments
		let components = []
		let systemClass, rest
		if (Array.isArray(args[0])) {
			components = args[0]
			systemClass = args[1]
			rest = args.slice(2)
		} else {
			systemClass = args[0]
			rest = args.slice(1)
		}

		// Make sure the system is valid
		if (isFunction(systemClass)) {
			// Create the system, and set the component array query
			let newSystem = new systemClass(...rest)
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
	 * Calls pre(), every(), and post() on all systems. These methods can return true to cause an additional rerun of all systems.
	 *
	 * @example
	 * world.run(deltaTime)
	 *
	 * @example
	 * // Example flow of method call order:
	 * // Setup systems:
	 * world.system(systemA)
	 * world.system(systemB)
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
		let status = true
		while (status) {
			status = undefined
			for (let system of this.systems) {
				let preStatus = invoke(system, 'pre', ...args)

				// Run the "every" method in the system
				let everyStatus
				if (isFunction(system.every)) {
					everyStatus = this.every(system.components, system.every.bind(system), ...args)
				}

				let postStatus = invoke(system, 'post', ...args)

				status = preStatus || everyStatus || postStatus
			}
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
	 * @return {MapIterator} If no callback specified, then a generator to the entities themselves. Otherwise, returns undefined.
	 */
	every(componentNames, callback, ...args) {
		// Get indexed map of entities
		let entities = this.index.query(...componentNames)

		if (isFunction(callback)) {
			// Go through the map of entities
			let status
			for (let entity of entities) {
				// Get all components as an array
				let components = componentNames.map(name => entity.get(name))

				// Pass components, then the main entity, then any additional arguments
				status = callback(...components, entity, ...args)

				// Stop the iteration when the callback returns false
				if (status === false) {
					break
				}
			}
			return status
		}
		return entities
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
