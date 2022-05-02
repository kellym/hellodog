const monitorSocket = require('./monitorSocket');
const state = require('./state');
const info = require('./info');
const { logEvent } = require('./log');
const observedSockets = new WeakSet();

const handledEvents = [
  'data',
  'secure',
  'lookup',
  'secureConnect',
  'connect',
  'error',
  'newListener',
  'removeListener'
];

module.exports = {

  // constructor wrapper for net.Socket
  socket (socket, originalFn, args) {
    let returnedSocket = originalFn.apply(socket, args);
    if (returnedSocket === undefined) returnedSocket = socket;
    startTrackingSocket(returnedSocket, args);
    return returnedSocket;
  },

  // wrapper for socket.connect
  connect (socket, fn, args) {
    startTrackingSocket(socket, args);
    return fn.apply(socket, args);
  },

  // wrapper for socket._writeGeneric, through which
  // all writing is done
  writeGeneric (socket, fn, args) {
    // args: writev, data, encoding, callback
    const data = args[1];
    if (!socket.connecting && socket._handle && state.active) {
      logEvent(socket, 'write', data);
    }
    return fn.apply(socket, args);
  },

  // wrapper for socket.push, which receives responses from TCP
  push (socket, fn, args) {
    const data = args[0];
    if (data) {
      logEvent(socket, 'read', data);
    }
    return fn.apply(socket, args);
  },

  emit(socket, fn, args) {
    const eventType = args[0];
    if (!handledEvents.includes(eventType)) {
      logEvent(socket, eventType);
    }
    return fn.apply(socket, args);
  }

};

// this sets up the tracking on a particular socket,
// as initialized from either a new Socket or socket.connect
function startTrackingSocket (socket, opts = []) {
  // try to set up connection info for the socket.
  // this may fire twice, and usually with updated info
  info.setConnection(socket, opts);
  // if we're not already monitoring certain events
  // on the socket, start now
  if (!observedSockets.has(socket)) {
    observedSockets.add(socket);
    //  start listening to events that
    // tell details about the socket
    monitorSocket(socket);
  }
}
