/** @ignore */
import { invoke, shallowClone } from './utilities.js'

/**
 * Entity class used for storing components.
 *
 * @class      Entity (name)
 */
export class Entity {
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
   *
   * @throws {Error} Cannot set entity id
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
   * Returns true if the entity has ANY of the specified component names.
   * If no component names are specified, this method returns false.
   *
   * @example
   * if (entity.hasAny('position', 'velocity')) {...}
   *
   * @param {...string} [components] - The component names to check for
   *
   * @return {boolean} true or false
   */
  hasAny(...components) {
    return components.some(name => name in this.data)
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
   * For unregistered components, passing no arguments to this will create a {} component,
   * if the component does not exist. The argument behavior is exactly the same as set().
   *
   * @example
   * const position = entity.access('position', 3, 4)
   *
   * @example
   * entity.access('anything').foo = 'bar'
   * // 'anything' now has { foo: 'bar' }
   *
   * @example
   * entity.access('anything', { foo: 'bar' }).foo2 = 'bar2'
   * // 'anything' now has { foo: 'bar', foo2: 'bar2' }
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
   * // If position was registered: { x: 1, y: 2 }
   * // If position was not registered: 1
   * // This is because only the first arg is used for unregistered components
   *
   * @example
   * entity.set('anonymousComponent', { keys: 'values' })
   *
   * @example
   * entity.set('someString', 'Any type of any value')
   *
   * @example
   * entity.set('thisCompIsUndefined', undefined)
   *
   * @example
   * entity.set('thisCompIsEmptyObject')
   *
   * @param {string}    compName - The component name to create. If there is a registered component for this name,
   * then its constructor will be called with (...args) and an object of that type will be created. The parent
   * entity reference gets injected into registered components after they are constructed. The onCreate method
   * gets called after the component is added to the entity, and after the entity is injected. The onCreate method
   * also gets passed the same (...args) as the component's constructor.
   * @param {...Object} [args]    - The arguments to forward to the registered component type. If the component type
   * is not registered, then only the first additional argument will be used as the value of the entire component.
   *
   * @return {Object} The original entity that set() was called on, so that operations can be chained.
   */
  set(compName, ...args) {
    const compClass = this.world?.entities.componentClasses[compName]
    if (compClass) {
      // Create registered component
      const comp = new compClass(...args)
      comp.entity = this
      this.data[compName] = comp
    } else if (args.length > 0) {
      // Use first argument as component value
      this.data[compName] = args[0]
    } else {
      // Set to an empty object if no args were specified
      this.data[compName] = {}
    }

    // Update the index with this component
    if (this.valid()) {
      this.world.entities.addToIndex(this, compName)
    }

    // Call custom onCreate to initialize component, and any additional arguments passed into set()
    invoke(this.data[compName], 'onCreate', ...args)

    return this
  }

  /**
   * Low level method to set components directly. It is recommended to use set() instead, unless
   * you know what you are doing. The onCreate method is not called, and it is expected that you
   * pass an already initialized component. By default, an error will be thrown if you try calling
   * this on a registered component, as that could have unintended consequences in your systems.
   * This method can be useful for saving and restoring components without serialization.
   *
   * @example
   * entity.replace('position', position)
   *
   * @param {string} compName  - The component name to set.
   * @param {Object} value     - Should be a previous component instance, or whatever is expected for
   * the component name.
   * @param {boolean} overwriteRegistered - Whether or not to proceed with overwriting components
   * in this entity that are registered components. By default, this is false.
   *
   * @return {Object} The original entity that replace() was called on, so that operations can be chained.
   */
  replace(compName, value, overwriteRegistered = false) {
    // Registered component check
    if (
      !overwriteRegistered &&
      this.world?.entities.componentClasses[compName]
    ) {
      throw new Error(
        `Cannot replace() component "${compName}" because it is registered. Please refer to the docs for details.`
      )
    }

    // Directly set value
    this.data[compName] = value

    // Update the index with this component
    if (this.valid()) {
      this.world.entities.addToIndex(this, compName)
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
        // Call custom onRemove
        invoke(this.data[component], 'onRemove')

        // Remove from index
        if (this.valid()) {
          this.world.entities.removeFromIndex(this, component)
        }

        // Remove from entity
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
    this.remove(...this.components)

    if (this.components.length > 0) {
      throw new Error(
        'Failed to remove all components. Components must have been added during the removeAll().'
      )
    }

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
      // Remove from world
      this.world.entities.entities.delete(this._id)
      this._id = undefined
    }
  }

  /**
   * Returns an array of component names this entity currently has.
   *
   * @return {Array<String>} Array of component names.
   */
  get components() {
    return Object.keys(this.data)
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
    const parsed = JSON.parse(data)
    for (const name in parsed) {
      const comp = this.access(name, {})

      // Either call custom method or copy all properties
      if (typeof comp.fromJSON === 'function') {
        comp.fromJSON(parsed[name])
      } else {
        Object.assign(this.access(name, {}), parsed[name])
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
      this._id = this.world.entities.nextEntityId++
      this.world.entities.entities.set(this._id, this)
      this.world.entities.addToIndex(this, ...this.components)
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
      this.world.entities.removeFromIndex(this, ...this.components)
      this.world.entities.entities.delete(this._id)
      this._id = undefined
      this.world = undefined
    }
  }

  /**
   * Creates a copy of this entity with all of the components cloned and returns it.
   * Individual components are either shallow or deep copied, depending on component
   * registration status and if a clone() method is defined. See entity.cloneComponentTo().
   *
   * @example
   * entity.clone()
   */
  clone() {
    if (!this.valid()) {
      throw new Error('Cannot clone detached or invalid entity.')
    }

    // Clone each component in this entity, to a new entity
    const newEntity = this.world.entity()
    for (const name in this.data) {
      this.cloneComponentTo(newEntity, name)
    }

    // Return the cloned entity
    return newEntity
  }

  /**
   * Clones a component from this entity to the target entity.
   *
   * @example
   * const source = world.entity().set('foo', 'bar')
   * const target = world.entity()
   * source.cloneComponentTo(target, 'foo')
   * assert(target.get('foo') === 'bar')
   *
   * @example
   * world.component('foo', class {
   *   onCreate(bar, baz) {
   *     this.bar = bar
   *     this.baz = baz
   *     this.qux = false
   *   }
   *   setQux(qux = true) {
   *     this.qux = qux
   *   }
   *   cloneArgs() {
   *     return [this.bar, this.baz]
   *   }
   *   clone(target) {
   *     target.qux = this.qux
   *   }
   * })
   * const source = world.entity()
   *   .set('foo', 'bar', 'baz')
   *   .set('qux', true)
   * const target = world.entity()
   * source.cloneComponentTo(target, 'foo')
   * assert(source.get('foo').bar === target.get('foo').bar)
   * assert(source.get('foo').baz === target.get('foo').baz)
   * assert(source.get('foo').qux === target.get('foo').qux)
   *
   * @param {Entity} targetEntity - Must be a valid entity. Could be part of another world, but it
   * is undefined behavior if the registered components are different types.
   * @param {string} name         - Component name of both source and target components.
   *
   * @return {Object} The original entity that cloneComponentTo() was called on,
   * so that operations can be chained.
   */
  cloneComponentTo(targetEntity, name) {
    // Get component and optional arguments for cloning
    const component = this.get(name)
    const args = invoke(component, 'cloneArgs') || []

    if (name in targetEntity.world.entities.componentClasses) {
      // Registered component, so create new using constructor, inject
      // entity, and call optional clone
      const newComponent = new targetEntity.world.entities.componentClasses[
        name
      ](...args)
      newComponent.entity = targetEntity
      targetEntity.data[name] = newComponent
      invoke(component, 'clone', newComponent)
    } else {
      // Unregistered component, so just shallow clone it
      targetEntity.data[name] = shallowClone(component)
    }

    // Update the index with this new component
    targetEntity.world.entities.addToIndex(targetEntity, name)

    // Call custom onCreate to initialize component, and any additional arguments passed into set()
    invoke(targetEntity.data[name], 'onCreate', ...args)

    return this
  }
}
