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

	// Create some entities, randomly add components to them
	let start = new Date()
	let count = 10000
	for (let i = 0; i < count; ++i) {
		let ent = world.entity()
		ent.set('compA', 5)
		if (getRandomInt(1, 100) < 50) {
			ent.update('compB', {val: 7})
		}
		if (getRandomInt(1, 100) > 50) {
			ent.update('compC', {val: 42})
		}
	}
	let end = new Date()
	let elapsed = (end - start) / 1000
	let speed = count / elapsed
	console.log(' * Creating entities: ' + speed + ' entities/second')

	// Query for entities
	start = new Date()

	world.every(['compA', 'compB'], function(compA, compB) {
		compA.newVal = compB.val
	})

	end = new Date()
	elapsed = (end - start) / 1000
	speed = count / elapsed
	console.log(' * Querying entities: ' + speed + ' entities/second')
}

runBenchmarks()
