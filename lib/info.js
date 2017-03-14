const _ = require('lodash');
const TTYWrap = process.binding('tty_wrap');

module.exports = {

  // get basic information of the connection from the args
  // passed to the socket constructor or connect method. this
  // is modified from node's internal net normalizeArgs method.
  connection(args) {
    let options = {};

    if (args.length === 0) {
      return undefined;
    } else if (args[0] !== null && typeof args[0] === 'object') {
      // connect(options, [cb])
      options = _.pick(args[0], ['host', 'port', 'path']);
    } else if (typeof args[0] === 'string' && Number(args[0]) >= 0) {
      // connect(path, [cb]);
      options.path = args[0];
    } else {
      // connect(port, [host], [cb])
      options.port = args[0];
      if (args.length > 1 && typeof args[1] === 'string') {
        options.host = args[1];
      }
    }

    return _.isEmpty(options) ? undefined : options;
  },

  // best guess to determine the socket type
  socketType(socket) {
    if (socket === process.stdout) {
      return 'stdout';
    } else if (socket === process.stderr) {
      return 'stderr';
    } else if (socket === process.stdin) {
      return 'stdin';
    } else if (socket._handle && socket._handle.fd >= 0) {
      return TTYWrap.guessHandleType(socket._handle.fd).toLowerCase();
    } else {
      return socket.constructor.name.toLowerCase();
    }
  }

};
