const asyncHooks = require('async_hooks');
const AsyncLocalStoragePolyfill = require('./asyncLocalStorage');

const AsyncLocalStorage = asyncHooks.AsyncLocalStorage || AsyncLocalStoragePolyfill;
const asyncLocalStorage = new AsyncLocalStorage();

module.exports = {

  get active () {
    const store = asyncLocalStorage.getStore();
    return !!(store && store.size);
  },

  forEach (fn) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      for (const state of store) {
        fn(state);
      }
    }
  },

  run (state, fn) {
    const store = asyncLocalStorage.getStore() || new Set();
    store.add(state);
    asyncLocalStorage.run(store, fn);
  }

};
