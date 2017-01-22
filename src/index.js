class Index {
	constructor(entities) {
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
	// These indeces are expected to be updated when doing entity/component operations
	build(hash, componentNames) {
		let matchingEntities = new Set()

		for (let entId in this.entities) {
			let ent = this.entities[entId]

			// Ensure entity contains all specified components
			if (ent.has(...componentNames)) {
				// Add entity to search results
				matchingEntities.add(ent)
			}
		}

		return this.index[hash] = {
			components: new Set(componentNames),
			entities: matchingEntities
		}
	}

	// Update an entity in the index (for creating components)
	add(entity, componentName) {
		for (let hash in this.index) {
			let group = this.index[hash]

			if (group.components.has(componentName)) {
				group.entities.add(entity)
			}
		}
	}

	// Update an entity in the index (for removing components)
	remove(entity, componentName) {
		for (let hash in this.index) {
			let group = this.index[hash]

			if (group.components.has(componentName)) {
				group.entities.delete(entity)
			}
		}
	}
}

exports.Index = Index
