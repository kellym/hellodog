const Tracker = require('./lib/tracker');

const singleton = function() {
  if (!this.tracker) {
    this.tracker = new Tracker();
  }
  return this.tracker;
};

module.exports = {
  get track() {
    return singleton().track;
  },
  patch() {
    singleton().patch();
  },
  unpatch() {
    singleton().unpatch();
  }
};
