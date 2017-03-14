const SocketLogger = require('./lib/logger');

let logger;

module.exports = {
  get record() {
    if(!logger)
      logger = new SocketLogger();
    return logger.record;
  }
};
