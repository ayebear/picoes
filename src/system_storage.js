/** @ignore */
export class SystemStorage {
  constructor() {
    this.systems = []
    this.contextData = undefined
    this.contextKey = undefined
  }

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

  // Update existing systems' context
  setContext(data, key) {
    this.contextData = data
    this.contextKey = key
    for (const system of this.systems) {
      this._injectContext(system)
    }
  }

  // Injects context into a system based on current context state
  _injectContext(system) {
    if (this.contextData && this.contextKey) {
      // Inject into specified key
      system[this.contextKey] = this.contextData
    } else if (this.contextData) {
      // Inject as keys of context
      for (const key in this.contextData) {
        system[key] = this.contextData[key]
      }
    }
  }
}
