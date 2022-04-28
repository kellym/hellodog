const asyncHooks = require('async_hooks');

// This is a polyfill for native AsyncLocalStorage that exists
// in Node 12.17.x and on.

module.exports = function() {

  const stateMap = new Map();

  function init (asyncId, type, triggerAsyncId) {
    if (stateMap.has(triggerAsyncId)) {
      stateMap.set(asyncId, stateMap.get(triggerAsyncId));
    }
  }
  function destroy (asyncId) {
    if (stateMap.has(asyncId)) {
      stateMap.delete(asyncId);
    }
  }

  return {

    getStore() {
      return stateMap.get(asyncHooks.executionAsyncId())
    },

    async run(state, fn) {
      const hooks = asyncHooks.createHook({ init, destroy });
      hooks.enable();
      stateMap.set(asyncHooks.executionAsyncId(), state);
      const result = await fn();
      hooks.disable();
      return result;
    }

  }

}
