const { guessHandleType } = require('../build/Release/guessHandleType.node');
const merge = require('./merge');

const connectionInfo = new WeakMap();

const info = module.exports = {

  // get basic information of the connection from the args
  // passed to the socket constructor or connect method. this
  // is modified from node's internal net normalizeArgs method.
  setConnection (socket, args) {
    let options = {};
    let isModified = false;

    let args0 = args[0];
    if (Array.isArray(args0) && typeof args0[0] === 'object') {
      args0 = args0[0];
    }
    if (args.length === 0) {
      return undefined;
    } else if (args0 !== null && typeof args0 === 'object') {
      // connect(options, [cb])
      const { host, port, path, pathname, protocol } = args0;
      if (host || port || path || pathname || protocol) {
        options = { host, port, path: path || pathname, protocol };
        isModified = true;
      }
    } else if (typeof args0 === 'string' && Number(args0) >= 0) {
      // connect(path, [cb]);
      options.path = args[0];
      isModified = !!args[0];
    } else {
      // connect(port, [host], [cb])
      options.port = args0;
      if (args.length > 1 && typeof args[1] === 'string') {
        options.host = args[1];
      }
      isModified = options.port || options.host;
    }
    if (isModified) {
      if (connectionInfo[socket]) {
        connectionInfo[socket] = merge(connectionInfo[socket], options);
      } else {
        connectionInfo[socket] = options;
      }
    } else {
      options = undefined;
    }
    return options;
  },

  getConnection (socket) {
    return connectionInfo[socket];
  },

  // best guess to determine the socket type
  socketType (socket) {
    if (socket === process.stdout) {
      return 'stdout';
    } else if (socket === process.stderr) {
      return 'stderr';
    } else if (socket === process.stdin) {
      return 'stdin';
    } else if (socket._handle && socket._handle.fd >= 0) {
      return guessHandleType(socket._handle.fd).toLowerCase();
    } else if (socket._parent) {
      return info.socketType(socket._parent);
    } else {
      return socket.constructor.name.toLowerCase();
    }
  }

};
