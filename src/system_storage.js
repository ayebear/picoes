import { invoke } from './utilities.js'

/** @ignore */
export class SystemStorage {
  /** SystemStorage constructor, needs reference back to world */
  constructor(world) {
    /** World instance */
    this.world = world
    /** List of systems, stored in run-order */
    this.systems = []
    /** Context passed to all systems */
    this.context = { world }
  }

  /** Pushes a system to the list with optional init/constructor args */
  register(systemClass, ...args) {
    // Make sure the system is valid
    if (typeof systemClass !== 'function') {
      throw new Error('System is not a valid function or class.')
    }
    // Create and add the system with context
    const newSystem = new systemClass(...args)
    this._injectContext(newSystem)
    invoke(newSystem, 'init', ...args)
    this.systems.push(newSystem)
  }

  /** Runs a system with optional args */
  run(...args) {
    let status = true
    // Continue rerunning while any systems return true
    while (status) {
      status = undefined
      for (const system of this.systems) {
        // Try to call the "run" method
        const result = invoke(system, 'run', ...args)
        status = status || result
      }
      // Clear args after first run, so re-runs can be identified
      args.length = 0
    }
  }

  /** Update existing systems' context */
  setContext(data) {
    this.context = { ...data, world: this.world }
    for (const system of this.systems) {
      this._injectContext(system)
    }
  }

  /** Injects context into a system based on current context state */
  _injectContext(system) {
    for (const key in this.context) {
      system[key] = this.context[key]
    }
  }
}
