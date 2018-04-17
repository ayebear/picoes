/**
 * An alternative indexer class to SimpleIndex. This has true O(1) queries (when memoized), for the cost
 * of slower component add/remove operations. As more queries are made, the slower add/remove become.
 *
 * @class      MemoizedQueryIndex (name)
 */
class MemoizedQueryIndex {
	constructor(world) {
		this.world = world
		this.clear()
	}

	// Removes everything from the index
	clear() {
		this.index = {}
	}

	// Uses an existing index or builds a new index, to return entities with the specified components
	*query(...componentNames) {
		// Return all entities
		if (componentNames.length === 0) {
			yield* this.world.entities.values()
			return
		}

		// Hash the component list
		let hash = this.hashComponents(componentNames)

		// Return already existing index
		if (hash in this.index) {
			yield* this.index[hash].entities.values()
			return
		}

		// Build new index for this component list
		yield* this.build(hash, componentNames).entities.values()
	}

	// Creates a hash from an array of component names
	hashComponents(names) {
		return JSON.stringify(names.sort())
	}

	// Builds an initial index for a set of components
	// These indexes are expected to be updated when doing entity/component operations
	build(hash, componentNames) {
		let matchingEntities = new Map()

		for (const [entityId, entity] of this.world.entities) {
			// Ensure entity contains all specified components
			if (entity.has(...componentNames)) {
				// Add entity to index
				matchingEntities.set(entity.id, entity)
			}
		}

		return this.index[hash] = {
			components: new Set(componentNames),
			entities: matchingEntities
		}
	}

	// Must use all component names from entity
	add(entity) {
		for (let hash in this.index) {
			const group = this.index[hash]

			// Check if the entity has all of the components of the index group
			if (entity.has(...group.components)) {
				// Add the entity
				group.entities.set(entity.id, entity)
			}
		}
	}

	// Remove certain components from the index for an entity
	remove(entity, ...componentNames) {
		for (let hash in this.index) {
			const group = this.index[hash]

			// Check if index group has any of the components that the entity has
			if (componentNames.some(name => group.components.has(name))) {
				// Remove the entity
				group.entities.delete(entity.id)
			}
		}
	}
}

exports.MemoizedQueryIndex = MemoizedQueryIndex
