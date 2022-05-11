import { Entity } from './entity.js'
import { invoke } from './utilities.js'

/** @ignore */
export class EntityStorage {
  /** EntityStorage constructor, needs reference back to world */
  constructor(world) {
    /** World instance */
    this.world = world
    /** Component keys to component classes */
    this.componentClasses = {}
    /** Used for generating entity IDs */
    this.nextEntityId = 1
    /** Maps entity IDs to entities */
    this.entities = new Map()
    /** Maps component keys to entities */
    this.index = new Map()
  }

  /**
   * Removes all entities along with their components.
   * This is more efficient than calling entity.destroy() on each, since
   * this will only call onRemove on each and then clear the index.
   */
  clear() {
    // Call onRemove on all components of all entities
    for (const { data } of this.entities.values()) {
      for (const componentName in data) {
        invoke(data[componentName], 'onRemove')
      }
    }

    // Clear entities
    this.entities.clear()
    this.index.clear()
  }

  /** Registers a function/class with a name as a component */
  registerComponent(name, componentClass) {
    if (typeof componentClass !== 'function') {
      throw new Error('Component is not a valid function or class.')
    }
    this.componentClasses[name] = componentClass
  }

  /** Creates a new entity attached to the world */
  createEntity() {
    const entityId = this.nextEntityId++
    const entity = new Entity(this.world, entityId)
    this.entities.set(entityId, entity)
    return entity
  }

  /** Forwards query args from world */
  each(...args) {
    return this.queryIndex(this.queryArgs(...args))
  }

  /** Returns an existing or new index */
  accessIndex(component) {
    return (
      this.index.get(component) ||
      this.index.set(component, new Map()).get(component)
    )
  }

  /** Add component with an entity to the index */
  addToIndex(entity, compName) {
    this.accessIndex(compName).set(entity.id, entity)
  }

  /** Remove component from the index for an entity */
  removeFromIndex(entity, compName) {
    this.accessIndex(compName).delete(entity.id)
  }

  /** Get component names and optional callback from query args */
  queryArgs(...args) {
    const result = {
      componentNames: [],
      callback: null,
    }
    for (const arg of args) {
      if (typeof arg === 'string') {
        result.componentNames.push(arg)
      } else if (typeof arg === 'function') {
        result.callback = arg
      } else if (Array.isArray(arg)) {
        // Add 1-level deep arrays of strings as separate component names
        for (const name of arg) {
          result.componentNames.push(name)
        }
      } else {
        throw new Error(
          `Unknown argument ${arg} with type ${typeof arg} passed to world.each().`
        )
      }
    }
    return result
  }

  /**
   * Uses an existing index or builds a new index, to get entities with the specified components
   * If callback is defined, it will be called for each entity with component data, and returns undefined
   * If callback is not defined, an array of entities will be returned
   */
  queryIndex({ componentNames, callback }) {
    // Return all entities (array if no callback)
    if (componentNames.length === 0) {
      const iter = this.entities.values()
      if (!callback) {
        return [...iter]
      }
      for (const entity of iter) {
        if (callback(entity.data, entity) === false) {
          break
        }
      }
      return
    }

    // Sort component names by number of components in each index
    // This allows us to get the minimum component index as the first element
    // This also helps short-circuit much faster during the full query loops with .every()
    componentNames.sort(
      (a, b) => this.accessIndex(a).size - this.accessIndex(b).size
    )
    const iter = this.accessIndex(componentNames.shift()).values()

    // Return array of matched entities
    if (!callback) {
      const results = []
      for (const entity of iter) {
        const { data } = entity
        if (componentNames.every(name => name in data)) {
          results.push(entity)
        }
      }
      return results
    }

    // Invoke callback for each matched entity
    for (const entity of iter) {
      const { data } = entity
      if (
        componentNames.every(name => name in data) &&
        callback(data, entity) === false
      ) {
        return
      }
    }
  }
}
