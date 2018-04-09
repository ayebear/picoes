/** @ignore */
class ComponentIndex {
	constructor(entities) {
		this.clear(entities)
	}

	// Removes everything from the index
	clear(entities) {
		this.entities = entities
		this.index = {}
	}

	// Uses an existing index or builds a new index, to return entities with the specified components
	query(componentNames = []) {
		let hash = this.hashComponents(componentNames)

		if (hash in this.index) {
			return this.index[hash].entities
		} else {
			return this.build(hash, componentNames).entities
		}
	}

	// Creates a hash from an array of component names
	hashComponents(names) {
		return JSON.stringify(names.concat().sort())
	}

	// Builds an initial index for a set of components
	// These indexes are expected to be updated when doing entity/component operations
	build(hash, componentNames) {
		let matchingEntities = new Map()

		for (const [entityId, entity] of this.entities) {
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

	// Checks if the current index group is supposed to match all entities
	isMatchAllGroup(componentNames, group) {
		return (componentNames.length === 0 && group.components.size === 0)
	}

	// Add an entity and all of its components to the index
	addEntity(entity) {
		const componentNames = Object.keys(entity.data)

		for (let hash in this.index) {
			const group = this.index[hash]

			// Check if the entity has all of the components of the index group
			const hasAll = entity.has(...group.components)

			// Add the entity
			if (hasAll || this.isMatchAllGroup(componentNames, group)) {
				group.entities.set(entity.id, entity)
			}
		}
	}

	// Remove certain components from the index for an entity
	remove(entity, ...componentNames) {
		for (let hash in this.index) {
			const group = this.index[hash]

			// Check if index group has any of the components that the entity has
			const hasAny = componentNames.some(name => group.components.has(name))

			// Remove the entity
			if (hasAny || this.isMatchAllGroup(componentNames, group)) {
				group.entities.delete(entity.id)
			}
		}
	}

	// Remove an entity and all of its components from the index
	removeEntity(entity) {
		this.remove(entity, ...Object.keys(entity.data))
	}
}

exports.ComponentIndex = ComponentIndex
