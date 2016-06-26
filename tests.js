// import 'es.js'
let es = require('./es.js')

function tests() {
	let world = new es.World()

	world.component('position', function(x, y) {
		this.x = x
		this.y = y
	})

	world.component('velocity', function(x, y) {
		this.x = x
		this.y = y
	})

	world.component('sprite', function(texture) {
		this.texture = texture
	})

	world.system(class {
		constructor() {
			this.components = ['position', 'velocity']
		}

		every(ent) {

		}
	})

	world.entity().set('position', 3, 4).set('velocity', 10, 1)

	world.run()
}

tests()
