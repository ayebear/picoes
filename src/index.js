class Index {
	constructor(entities) {
		this.clear(entities)
	}

	// Removes everything from the index
	clear(entities) {
		this.entities = entities
		this.index = {}
	}

	// Uses an existing index or builds a new index, to return entities with the specified components
	query(componentNames) {
		let hash = this.hashComponents(componentNames)

		if (hash in this.index) {
			return this.index[hash].entities
		} else {
			return this.build(hash, componentNames).entities
		}
	}

	// Creates a hash from an array of component names
	hashComponents(names) {
		return names.concat().sort().join(':')
	}

	// Builds an initial index for a set of components
	// These indexes are expected to be updated when doing entity/component operations
	build(hash, componentNames) {
		let matchingEntities = new Map()

		for (let entId in this.entities) {
			let ent = this.entities[entId]

			// Ensure entity contains all specified components
			if (ent.has(...componentNames)) {
				// Add entity to index
				matchingEntities.set(ent.toString(), ent)
			}
		}

		return this.index[hash] = {
			components: new Set(componentNames),
			entities: matchingEntities
		}
	}

	// Generic way to apply an operation to matching component groups
	apply(componentNames, callback) {
		for (let hash in this.index) {
			let group = this.index[hash]

			// Check if index group has any of the components that the entity has
			let hasAny = componentNames.some(name => group.components.has(name))

			// Check if the current index group is supposed to match all entities
			let isMatchAllGroup = ((componentNames == undefined || componentNames.length === 0) && group.components.size == 0)

			if (hasAny || isMatchAllGroup) {
				callback(group.entities)
			}
		}
	}

	// Update an entity in the index (for creating components)
	add(entity, ...componentNames) {
		this.apply(componentNames, (entities) => {
			entities.set(entity.toString(), entity)
		})
	}

	// Update an entity in the index (for removing components)
	remove(entity, ...componentNames) {
		this.apply(componentNames, (entities) => {
			entities.delete(entity.toString())
		})
	}

	// Add an entity and all of its components to the index
	addEntity(entity) {
		this.add(entity, ...Object.keys(entity.data))
	}

	// Remove an entity and all of its components from the index
	removeEntity(entity) {
		this.remove(entity, ...Object.keys(entity.data))
	}
}

exports.Index = Index
