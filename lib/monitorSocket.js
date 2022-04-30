const { logEvent } = require('./log');
const info = require('./info');
const merge = require('./merge');
const state = require('./state');

// start listening to certain events that give us
// details about this transaction.
module.exports = function monitorSocket (socket) {
  socket.on('error', err => {
    logEvent(socket, 'error', null, { err });
  });

  // when the socket registers as secure, let's track that for our log
  socket.on('secure', () => {
    logEvent(socket, 'secure', null, { encrypted: true });
  });

  socket.on('secureConnect', () => {
    logEvent(socket, 'secureConnect', null, { encrypted: true });
  });

  // the lookup event gives us our host name as well as an ip address,
  // and any DNS lookup error
  socket.on('lookup', (err, ip, family, host) => {
    logEvent(socket, 'lookup', null, { connection: { err, ip, host } });
  });

  // ensure on connect that if this is the decrypted version of an
  // encrypted socket, it tries to establish final connection information,
  // some which may come from the parent
  socket.on('connect', (err, req) => {
    const source = info.socketType(socket);
    const connection = {
      err,
      port: socket.remotePort,
      ip: socket.remoteAddress
    };
    if (socket._parent) {
      merge(connection, info.getConnection(socket._parent));
    }
    logEvent(socket, 'connect', null, { connection, source });
  });
};
