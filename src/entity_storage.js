export class EntityStorage {
  constructor() {
    /**
     * Maps entity IDs to entities
     * @ignore
     */
    this.entities = new Map()

    /** @ignore */
    this.components = {}

    /** @ignore */
    this.idCounter = 1

    /**
     * Maps component keys to entities
     * @ignore
     */
    this.index = {}
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
    if (typeof componentClass === 'function') {
      this.components[name] = componentClass
      return name
    }
  }

  // Creates a new entity attached to the world
  createEntity() {
    const entityId = this.idCounter++
    const entity = new Entity(this, entityId)
    this.entities.set(entityId, entity)
    return entity
  }

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
        throw new Error(
          `Unknown argument ${arg} with type ${typeof arg} passed to world.each().`
        )
      }
    }

    // Get indexed map of entities
    this.index.query(compNames, callback)
  }
}
