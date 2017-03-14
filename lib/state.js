let current;
const asyncHook = require('async-hook');

const state = module.exports = {

  get current() {
    return current;
  },

  // references to maintain state
  refs: new Map(),

  // add hooks to AsyncWrap to keep track of a single request
  // to the API
  track() {
    asyncHook.addHooks(state.hooks);
    asyncHook.enable();
  },

  // remove hooks, but don'e disable asyncHook in case another
  // library uses them
  untrack() {
    asyncHook.removeHooks(state.hooks);
  },

  create() {
    current = new Map();
    return current;
  },

  reset() {
    current = undefined;
  },

  // these are the hooks used for tracking handles
  get hooks() {
    return {
      init: state.store,
      pre: state.restore,
      post: state.restore,
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

  // restore the transactions, then delete the reference even
  // though we're using a weak map
  restoreAndDelete(uid) {
    state.restore(uid);
    state.refs.delete(uid);
  }

};
