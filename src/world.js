import { Entity } from './entity.js'
import { SystemStorage } from './system_storage.js'
import { EntityStorage } from './entity_storage.js'

/**
 * Class for world.
 *
 * @class World (name)
 */
export class World {
  /**
   * Constructs an instance of the world.
   *
   * @param {object} [options] - The initial systems, components, and context to setup in the world.
   * Each one is optional. See below for registering these after world construction.
   *
   * @example
   * const world = new World({
   *   components: { position, velocity },
   *   systems: [Input, Physics, Render],
   *   context: { state },
   * })
   */
  constructor(options) {
    /** @ignore */
    this._systems = new SystemStorage(this)
    /** @ignore */
    this.entities = new EntityStorage(this)

    // Register components, context, and systems
    if (options) {
      if (options.components) {
        this.components = options.components
      }
      if (options.context) {
        this.context = options.context
      }
      if (options.systems) {
        this.systems = options.systems
      }
    }
  }

  /**
   * Removes all entities from the world.
   * Does not affect any registered systems or components.
   *
   * @example
   * world.clear()
   */
  clear() {
    this.entities.clear()
  }

  /**
   * Registers a component type to the world. Components must be constructable. If the component has
   * an onCreate(), it is passed all of the arguments from methods like entity.set(). Also, components
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
   *     onCreate(some, args) {
   *         this.some = some
   *         this.args = args
   *         this.entity.set('whatever') // this.entity is auto-injected, and this is safe to do here
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
    this.entities.registerComponent(name, componentClass)
  }

  /**
   * Registers all components in an object. Merges with existing registered components.
   *
   * @example
   * world.components = { position: Position }
   */
  set components(comps) {
    for (let key in comps) {
      this.entities.registerComponent(key, comps[key])
    }
  }

  /**
   * Returns currently registered components.
   *
   * @example
   * const { position: Position } = world.components
   */
  get components() {
    return this.entities.componentClasses
  }

  /**
   * Creates a new entity in the world
   *
   * @example
   * world.entity()
   *
   * @return {Entity} The new entity created
   */
  entity() {
    return this.entities.createEntity()
  }

  /**
   * Sets a context object that is automatically injected into all existing and new systems.
   * Calling this multiple times will overwrite any previous contexts passed. One caveat is that
   * you can only start to use the injected context in systems starting with init(). It is not
   * available in the constructor.
   *
   * @param {Object} data - The object to use as context to pass to systems.
   * All the keys inside the context object will be spread into the top-level of the system.
   *
   * @example
   * const state = { app: new PIXI.Application() }
   * const world = new World()
   * world.context = state // new and existing systems can directly use this.app
   * world.system(...)
   */
  set context(data) {
    this._systems.setContext(data)
  }

  /**
   * Returns currently set context object.
   *
   * @example
   * const { app } = world.context
   */
  get context() {
    return this._systems.context
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
   *   init(key) {
   *     // Have access to this.keyboard here, but not in constructor
   *     this.key = key
   *   }
   *   run(dt) {
   *     if (this.keyboard.isPressed(this.key)) {
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
   * // Inject context (see world.context)
   * world.context = { keyboard: new Keyboard() }
   * // Register systems in order (this method)
   * world.system(InputSystem, 'w') // pass arguments to init/constructor
   * world.system(MovementSystem)
   * // Run systems (can get dt or frame time)
   * world.run(1000.0 / 60.0)
   *
   * @param {Function} systemClass - The system class to instantiate. Can contain a
   * constructor(), init(), run(), or any other custom methods/properties.
   *
   * @param {...Object} [args] - The arguments to forward to the system's constructor and init.
   * Note that it is recommended to use init if using context, see world.context.
   * Passing args here is still useful, because it can be specific to each system, where
   * the same context is passed to all systems.
   */
  system(systemClass, ...args) {
    this._systems.register(systemClass, ...args)
  }

  /**
   * Registers additional systems, in the order specified. See world.system().
   *
   * @example
   * world.systems = [inputSystem, movementSystem]
   */
  set systems(values) {
    for (const sys of values) {
      this._systems.register(sys)
    }
  }

  /**
   * Returns currently added systems, in the order added.
   *
   * @example
   * const [inputSystem, movementSystem] = world.systems
   */
  get systems() {
    return this._systems.systems
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
    this._systems.run(...args)
  }

  /**
   * Iterate through components and entities with all of the specified component names
   *
   * @example
   * // Use a callback to process entities one-by-one
   * // This is the recommended way, as it is higher performance than allocating and
   * // returning an array
   * world.each('comp', ({ comp }) => { comp.value = 0 })
   *
   * @example
   * // Get an array of entities
   * const entities = world.each('comp')
   * for (const entity of entities) {...}
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
   * @param {...Object} args - Can pass component names, arrays of component names, and a callback,
   * in any order.
   *
   * **{...string}**: The component names to match entities with. This checks if the entity
   * has ALL of the specified components, but does not check for additional components.
   *
   * **{Function}**: The callback to call for each matched entity. Takes (entity.data, entity).
   * Entity data is an object of {[componentName]: [component]}, that can be destructured with syntax
   * shown in the examples.
   *
   * @return {Entity[]} If no callback is specified, then returns an array of the entity results.
   */
  each(...args) {
    return this.entities.each(...args)
  }
}
