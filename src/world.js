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

		/**
		 * Context information
		 */
		this.contextData = undefined
		this.contextKey = undefined
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
	 * Sets a context object that is automatically injected into all existing and new systems.
	 * Calling this multiple times will overwrite any previous contexts passed.
	 *
	 * @param {Object} [data] - The object to use as context to pass to systems
	 * @param {string} [key] - The top-level key to inject into systems for the context object.
	 * If no key is specified, then all the keys inside the context object will be spread into the
	 * top-level of the system.
	 *
	 * @example
	 * const state = { app: new PIXI.Application() }
	 * const world = new World()
	 * world.context(state) // systems can directly use this.app
	 * world.system(...)
	 *
	 * @example
	 * world.context(state, 'state') // systems use this.state.app
	 *
	 * @return {Entity} The new entity created
	 */
	context(data, key) {
		this.contextData = data
		this.contextKey = key

		// Update existing systems' context
		for (const system of this.systems) {
			this._injectContext(system)
		}
	}

	/**
	 * Registers a system to the world.
	 * The order the systems get registered, is the order then run in.
	 *
	 * @example
	 * // Movement system (basic example)
	 * class MovementSystem {
	 *   run(dt) {
	 *     world.each('position', 'velocity', ({ position, velocity }) => {
	 *       position.x += velocity.x * dt
	 *       position.y += velocity.y * dt
	 *     })
	 *   }
	 * }
	 * // Input system (advanced example)
	 * class InputSystem {
	 *   constructor(button) {
	 *     // This is showing how you can optionally pass parameters to the system's constructor
	 *     this.button = button
	 *     // See world.context() for a simpler way to inject dependencies
	 *   }
	 *   run(dt) {
	 *     if (this.button.isPressed()) {
	 *       world.each('controlled', 'velocity', ({ velocity }, entity) => {
	 *         // Start moving all controlled entities to the right
	 *         velocity.x = 1
	 *         velocity.y = 0
	 *         // Can also use the full entity here, in this case to add a new component
	 *         entity.set('useFuel')
	 *       })
	 *     }
	 *   }
	 * }
	 * // Register systems in order (this method)
	 * world.system(InputSystem, button) // pass button to system constructor
	 * world.system(MovementSystem)
	 * // Run systems (can get dt or frame time)
	 * world.run(1000.0 / 60.0)
	 *
	 * @param {...Object} args - Both signatures are accepted: (components, systemClass, ...args) or (systemClass, ...args).
	 *
	 * **{systemClass}**: The system class to instantiate. Can contain a constructor(), run(), or any other custom methods/properties.
	 *
	 * **[...args]**: The arguments to forward to the system's constructor.
	 *
	 * @return {number} Unique ID of the system on success or undefined on failure
	 */
	system(...args) {
		// Get systemClass and remaining args from args
		const [systemClass, ...rest] = args

		// Make sure the system is valid
		if (isFunction(systemClass)) {
			// Create the system
			const newSystem = new systemClass(...rest)

			// Inject context
			this._injectContext(newSystem)

			// Add the system, return its ID
			return this.systems.push(newSystem) - 1
		}
	}

	/**
	 * Calls run() on all systems. These methods can return true to cause an additional rerun of all systems.
	 * Reruns will not receive the args passed into run(), as a way to identify reruns.
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
	 * // systemA.run()
	 * // systemB.run()
	 *
	 * @param {...Object} [args] - The arguments to forward to the systems' methods
	 */
	run(...args) {
		let status = true
		// Continue rerunning while any systems return true
		while (status) {
			status = undefined
			for (const system of this.systems) {
				// Try to call the "run" method
				const result = invoke(system, 'run', ...args)
				status = status || result
			}

			// Clear args after first run, so re-runs can be identified
			args = []
		}
	}

	/**
	 * Iterate through components and entities with all of the specified component names
	 *
	 * @example
	 * // Use a callback to process entities one-by-one
	 * world.each('comp', ({ comp }) => { comp.value = 0 })
	 *
	 * @example
	 * // Get an iterator for the entities
	 * const it = world.each('comp')
	 * for (let entity of it) {...}
	 * 
	 * @example
	 * // Pass multiple components, arrays, use extra entity parameter,
	 * // and destructure components outside the query
	 * world.each('compA', ['more', 'comps'], 'compB', ({ compA, compC }, entity) => {
	 *   if (compC) compC.foo(compC.bar)
	 *   compA.foo = 'bar'
	 *   entity.remove('compB')
	 * })
	 *
	 * @param {Array}     componentNames - The component names to match entities with. This checks if the entity
	 * has ALL of the specified components, but does not check for additional components.
	 * @param {Function}  callback       - The callback to call for each entity. Takes (entity.data, entity).
	 * Entity data is just an object of {[componentName]: [component]}, that can be destructured with syntax shown
	 * in the examples.
	 *
	 * @return {MapIterator} If no callback specified, then returns a generator to the entities themselves.
	 * Otherwise, returns the last loop iteration status, returned by the callback.
	 */
	each(...args) {
		// Gather component names and a callback (if any) from args
		const compNames = []
		let callback
		for (const arg of args) {
			if (typeof arg === 'string') {
				compNames.push(arg)
			} else if (typeof arg === 'function') {
				callback = arg
			} else if (Array.isArray(arg)) {
				// Add 1-level deep arrays of strings as separate component names
				for (const name of arg) {
					compNames.push(name)
				}
			} else {
				throw new Error(`Unknown argument ${arg} with type ${typeof arg} passed to world.each().`)
			}
		}

		// Get indexed map of entities
		const entities = this.index.query(...compNames)

		if (callback) {
			// Go through the map of entities
			let status
			for (const entity of entities) {
				// Pass component data and the main entity
				status = callback(entity.data, entity)

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
	 * Simplified version of each(), returns an array instead of an iterator.
	 *
	 * @example
	 * const entities = world.get('player', 'sprite')
	 *
	 * @param {Array} componentNames - The component names to match on. See each() for how this matches.
	 *
	 * @return {Array} Array of entities, instead of iterator like each().
	 */
	get(...componentNames) {
		return [...this.each(componentNames)]
	}

	/**
	 * Returns an entity by ID
	 * Returns undefined if it doesn't exist
	 *
	 * @example
	 * world.getEntityById(123)
	 *
	 * @param {number} entityId - The entity ID to lookup for the entity
	 *
	 * @return {Entity} Entity if found, otherwise undefined
	 */
	getEntityById(entityId) {
		return this.entities.get(entityId)
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
					protoObject[compName] = JSON.stringify(
						inputObject[compName]
					)
				}
				this.entityTemplates[protoName] = protoObject
				++count
			}
		}

		return count
	}

	/**
	 * Injects context into a system based on current context state
	 * @ignore
	 */
	_injectContext(system) {
		if (this.contextData && this.contextKey) {
			// Inject into specified key
			system[this.contextKey] = this.contextData
		} else if (this.contextData) {
			// Inject as keys of context
			for (const key in this.contextData) {
				system[key] = this.contextData[key]
			}
		}
	}
}

exports.World = World
