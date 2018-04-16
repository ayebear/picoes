/**
 * @ignore
 * Returns index of smallest element
 */
const minIndexReducer = (minIndex, value, index, values) => (value < values[minIndex] ? index : minIndex)

/**
 * The default indexer for World. Extremely fast component adding/removing, for the cost of slightly
 * slower entity querying performance.
 *
 * @class SimpleIndex (name)
 */
class SimpleIndex {
	constructor(world) {
		this.world = world
		this.clear()
	}

	// Removes everything from the index
	clear() {
		this.index = {}
	}

	// Returns an existing or new index
	access(component) {
		return this.index[component] || (this.index[component] = new Map())
	}

	// Uses an existing index or builds a new index, to return entities with the specified components
	*query(...componentNames) {
		// Return all entities
		if (componentNames.length === 0) {
			yield* this.world.entities.values()
			return
		}

		// Get the index name with the least number of entities
		const minCompIndex = componentNames
			.map(name => this.access(name).size)
			.reduce(minIndexReducer, 0)
		const minComp = componentNames[minCompIndex]

		// Return matching entities
		for (let entity of this.index[minComp].values()) {
			if (entity.has(...componentNames)) {
				yield entity
			}
		}
	}

	// Add certain components with an entity to the index
	add(entity, ...componentNames) {
		for (let component of componentNames) {
			this.access(component).set(entity.id, entity)
		}
	}

	// TODO: Remove these from the index classes, have Entity pass whatever is needed
	// Add an entity and all of its components to the index
	addEntity(entity) {
		this.add(entity, ...entity.components)
	}

	// Remove certain components from the index for an entity
	remove(entity, ...componentNames) {
		for (let component of componentNames) {
			this.access(component).delete(entity.id)
		}
	}

	// Remove an entity and all of its components from the index
	removeEntity(entity) {
		this.remove(entity, ...entity.components)
	}
}

exports.SimpleIndex = SimpleIndex
