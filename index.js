const SocketRecorder = require('./lib/recorder');

const singleton = function() {
  if (!this.recorder) {
    this.recorder = new SocketRecorder();
  }
  return this.recorder;
};

module.exports = {
  get record() {
    return singleton().record;
  },
  patch() {
    singleton().patch();
  },
  unpatch() {
    singleton().unpatch();
  }
};
