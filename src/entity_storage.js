import { Entity } from './entity'
import { invoke } from './utilities'

/**
 * @ignore
 * Returns index of smallest element
 */
const minIndexReducer = (minIndex, value, index, values) =>
  value < values[minIndex] ? index : minIndex

export class EntityStorage {
  constructor(world) {
    /** @ignore */
    this.world = world
    /** @ignore */
    this.componentClasses = {}
    /** @ignore */
    this.nextEntityId = 1

    /**
     * Maps entity IDs to entities
     * @ignore
     */
    this.entities = new Map()

    /**
     * Maps component keys to entities
     * @ignore
     */
    this.index = new Map()
  }

  clear() {
    // Call onRemove on all components of all entities
    for (const [, entity] of this.entities) {
      for (let componentName in entity.data) {
        // Get component, and call onRemove if it exists as a function
        let component = entity.data[componentName]
        invoke(component, 'onRemove')
      }
    }

    // Clear entities
    this.entities.clear()
    this.index.clear()
  }

  registerComponent(name, componentClass) {
    // Only allow functions and classes to be components
    if (typeof componentClass !== 'function') {
      throw new Error('Component is not a valid function or class.')
    }
    this.componentClasses[name] = componentClass
  }

  // Creates a new entity attached to the world
  createEntity() {
    const entityId = this.nextEntityId++
    const entity = new Entity(this.world, entityId)
    this.entities.set(entityId, entity)
    return entity
  }

  // Forwards query args from world
  each(...args) {
    return this.queryIndex(this.queryArgs(...args))
  }

  // Returns an existing or new index
  accessIndex(component) {
    // TODO: Compare with object based approach for performance
    return (
      this.index.get(component) ||
      this.index.set(component, new Map()).get(component)
    )
  }

  // Add certain components with an entity to the index
  addToIndex(entity, ...componentNames) {
    for (let component of componentNames) {
      this.accessIndex(component).set(entity.id, entity)
    }
  }

  // Remove certain components from the index for an entity
  removeFromIndex(entity, ...componentNames) {
    for (let component of componentNames) {
      this.accessIndex(component).delete(entity.id)
    }
  }

  queryArgs(...args) {
    // Gather component names and a callback (if any) from args
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

  // Uses an existing index or builds a new index, to get entities with the specified components
  // If callback is defined, it will be called for each entity with component data, and returns undefined
  // If callback is not defined, an array of entities will be returned
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

    // Get the index name with the least number of entities
    const minCompIndex = componentNames
      .map(name => this.accessIndex(name).size)
      .reduce(minIndexReducer, 0)
    const minComp = componentNames[minCompIndex]

    // Return matching entities (array if no callback)
    const iter = this.index.get(minComp).values()
    if (!callback) {
      const results = []
      for (const entity of iter) {
        if (entity.has(...componentNames)) {
          results.push(entity)
        }
      }
      return results
    }
    for (const entity of iter) {
      if (
        entity.has(...componentNames) &&
        callback(entity.data, entity) === false
      ) {
        return
      }
    }
  }
}
