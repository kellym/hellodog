const getLog = require('./getLog');
const info = require('./info');
const merge = require('./merge');
const state = require('./state');

// start listening to certain events that give us
// details about this transaction.
module.exports = function monitorSocket (socket) {
  socket.on('error', err => {
    state.forEach(asyncState => {
      const log = getLog(asyncState, socket);
      merge(log.connection, {
        err: err || undefined
      });
    });
  });

  // when the socket registers as secure, let's track that for our log
  socket.on('secure', () => {
    state.forEach(asyncState => {
      const log = getLog(asyncState, socket);
      log.encrypted = true;
    });
  });

  // the lookup event gives us our host name as well as an ip address,
  // and any DNS lookup error
  socket.on('lookup', (err, address, family, host) => {
    state.forEach(asyncState => {
      const log = getLog(asyncState, socket);
      merge(log.connection, {
        err: err || undefined,
        ip: address,
        host: host
      });
    });
  });

  // ensure on connect that if this is the decrypted version of an
  // encrypted socket, it tries to establish final connection information,
  // some which may come from the parent
  socket.on('connect', (err, req) => {
    const source = info.socketType(socket);
    state.forEach(asyncState => {
      const log = getLog(asyncState, socket);
      const parentLog = socket._parent ? getLog(asyncState, socket._parent) : {};
      // redefine the source property, since TLSSocket won't give us a
      // proper type until now
      log.source = source;
      merge(log.connection, parentLog.connection, {
        err: err,
        port: socket.remotePort,
        ip: socket.remoteAddress
      });
    });
  });
};
