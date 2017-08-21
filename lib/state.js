const integrated = Number(process.version.replace(/^v?(\d+\.\d+).*/, '$1')) >= 8.1,
      asyncHook  = require(integrated ? 'async_hooks' : 'async-hook');


// this is a module-scoped reference to the current
// state. it can't be replaced outside this script,
// so it should ensure that our state is retained
let current;
let hooks;

const state = module.exports = {

  // getter for the current state.
  // no setter is available
  get current() {
    return current;
  },

  // references to handle objects to maintain state
  refs: new Map(),

  // add hooks to AsyncWrap to keep track of a single request
  // to the API
  track() {
    if (!asyncHook._state) {
      if (integrated) {
        hooks = asyncHook.createHook(state.hooks);
        hooks.enable();
      } else {
        asyncHook.addHooks(state.hooks);
        asyncHook.enable();
      }
    }
  },

  // remove hooks, but don'e disable asyncHook in case another
  // library uses them
  untrack() {
    if (integrated) {
      hooks.disable();
    } else {
      asyncHook.removeHooks(state.hooks);
    }
  },

  // create a new state and replace the current one
  create(newState) {
    current = newState;
    return current;
  },

  // remove the current state entirely
  reset() {
    current = undefined;
  },

  // these are the hooks used for tracking handles
  get hooks() {
    return {
      init: state.store,
      pre: state.restore,
      before: state.restore, // 8.1+
      post: state.restore,
      after: state.restore,  // 8.1+
      destroy: state.restoreAndDelete
    };
  },

  // store a reference to the current transactions by UID
  store(uid) {
    state.refs.set(uid, current);
  },

  // restore the current transactions based on UID
  restore(uid) {
    current = state.refs.get(uid);
  },

  // restore the transactions, then delete the reference
  restoreAndDelete(uid) {
    state.restore(uid);
    state.refs.delete(uid);
  }

};
