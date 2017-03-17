const SocketLogger = require('./lib/logger');

const singleton = function() {
  if (!this.logger) {
    this.logger = new SocketLogger();
  }
  return this.logger;
};

const logger = module.exports = {
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
