const info = require('./info');
const crypto = require('crypto');
const uuid = require('uuid');

const randomUUID = crypto.randomUUID || uuid.v4;

const uidSymbol = Symbol('uid');

// gets the current socket log from the current state.
// some sockets like stdout remain open across multiple
// states. if a log doesn't exist yet for this socket
// on this state, create it.
module.exports = function getLog (state, socket) {
  let log;
  if (socket[uidSymbol] === undefined) {
    socket[uidSymbol] = randomUUID();
  }
  if (state) {
    log = state.get(socket[uidSymbol]);
  }
  if (!log) {
    // prepare basic state of transactions we'll log
    log = {
      id: socket[uidSymbol],
      events: [],
      source: info.socketType(socket)
    };
    if (state) state.set(socket[uidSymbol], log);
  }
  const connection = info.getConnection(socket);
  if (connection) {
    log.connection = connection;
  }
  return log;
};
