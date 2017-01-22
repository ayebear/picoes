let es = require('../src/picoes.js')

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min
}

function runBenchmarks() {

	let world = new es.World()
	world.component('compA', function(val) {
		this.val = val
	})
	world.component('compB', {
		val: 0,
		val2: 0
	})
	world.component('compC')

	let compTypes = 50
	for (let i = 0; i < compTypes; ++i) {
		world.component('comp' + i)
	}

	// Create some entities, randomly add components to them
	let start = new Date()
	let count = 100000

	console.log('Testing ' + count + ' entities...')

	for (let i = 0; i < count; ++i) {
		let ent = world.entity()
		ent.set('compA', 5)
		if (getRandomInt(1, 100) < 50) {
			ent.update('compB', {val: 7})
		}
		if (getRandomInt(1, 100) > 50) {
			ent.update('compC', {val: 42})
		}
		for (let i = 0; i < compTypes; ++i) {
			if (getRandomInt(1, 100) > 50) {
				ent.set('comp' + i)
			}
		}
	}
	let end = new Date()
	let elapsed = (end - start) / 1000
	let speed = count / elapsed
	console.log(' * Creating entities: ' + speed + ' entities/second\n\tTook ' + elapsed + ' sec')

	// Query for entities
	start = new Date()
	let start2 = null

	// world.every(['compA', 'compB'], function(compA, compB) {
	// 	compA.newVal = compB.val
	// })
	let trials = 600
	let systems = 40
	let results = null
	for (let i = 0; i < trials * systems; ++i) {
		if (i === 1) {
			// For timing cached results
			start2 = new Date()
		}

		results = world.query(['compA', 'compB'])
		results = world.query(['compA', 'compC', 'comp5'])
		results = world.query(['compA', 'compC', 'comp6'])
		results = world.query(['compA', 'compC', 'comp7'])
		results = world.query(['compA', 'compC', 'comp8'])
		results = world.query(['compA', 'compC', 'comp9'])
		results = world.query(['compA', 'compC', 'comp10'])
		results = world.query(['compA', 'compC', 'comp5', 'comp6', 'comp7'])
	}

	end = new Date()
	elapsed = (end - start) / 1000
	let elapsed2 = (end - start2) / 1000
	speed = (count * trials * systems) / elapsed
	console.log(' * Querying entities: ' + speed + ' entities/second\n\tTook ' + elapsed + ' + ' + elapsed2 + ' sec (' + ((1 / elapsed2) * trials) + ' fps max)')
}

// Only run benchmarks outside of tests
// runBenchmarks()
