const { World } = require('../index.js')
const { SimpleIndex } = require('../src/simple_index.js')
const { MemoizedQueryIndex } = require('../src/memoized_query_index.js')

function runBenchmarks() {

	for (let indexer of [SimpleIndex, MemoizedQueryIndex]) {
		console.log(`========== Testing ${indexer.name} ===========`)

		let world = new World(indexer)
		world.component('compA', function(val) {
			this.val = val
		})

		let start = new Date()
		for (let fullTrial = 1; fullTrial <= 5; ++fullTrial) {
			console.log('Full trial #' + fullTrial)

			// Create some entities, and add components to them
			let count = 10000

			for (let i = 0; i < count / 4; ++i) {
				let ent = world.entity()
				ent.set('compA', 1)
				ent.set('compB', {val: 7})
				ent.set('compC', {val: 42})
				for (let i = 0; i < 40; ++i) {
					ent.set('comp' + i, i)
				}
			}
			for (let i = 0; i < count / 4; ++i) {
				let ent = world.entity()
				ent.set('compA', 2)
				for (let i = 0; i < 20; ++i) {
					ent.set('comp' + i, i)
				}
			}
			for (let i = 0; i < count / 4; ++i) {
				let ent = world.entity()
				ent.set('compB', {val: 3})
				for (let i = 15; i < 50; ++i) {
					ent.set('comp' + i, i)
				}
			}
			for (let i = 0; i < count / 4; ++i) {
				let ent = world.entity()
				ent.set('compC', {val: 4})
			}

			// Query for entities
			let systems = 50
			let results = null
			for (let i = 0; i < systems; ++i) {
				results = world.every(['compA', 'compB'])
				results = world.every(['compA', 'compB', 'compC', 'comp' + i])
				results = world.every(['compA', 'compC', 'comp5', 'comp6', 'comp7'])
				results = world.every(['compB', 'compC', 'comp10'])
				results = world.every(['compB', 'compC', 'comp30'])
				results = world.every(['compC', 'comp30'])
				results = world.every(['compC'])

				// Simulate a real system
				world.every(['comp45', 'compB'], (f, b) => b.val += f)
			}

			// Destroy all numbered components
			for (let i = 0; i < systems; ++i) {
				world.every(['comp' + i], (c, e) => e.destroy())
			}
		}

		// Print elapsed time
		let end = new Date()
		let elapsed = (end - start) / 1000
		console.log(`Elapsed time: ${elapsed} sec`)
	}
}

// Only run benchmarks outside of tests
// runBenchmarks()
