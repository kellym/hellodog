const monitorSocket = require('./monitorSocket');
const state = require('./state');
const info = require('./info');
const getLog = require('./getLog');

const observedSockets = new WeakSet();
const baseCreatedAt = (new Date()).getTime();
const baseHrtime = process.hrtime();

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
      log(socket, 'request', data);
    }
    return fn.apply(socket, args);
  },

  // wrapper for socket.push, which receives responses from TCP
  push (socket, fn, args) {
    const data = args[0];
    if (data) {
      log(socket, 'response', data);
    }
    return fn.apply(socket, args);
  }

};

// this sets up the tracking on a particular socket,
// as initialized from either a new Socket or socket.connect
function startTrackingSocket (socket, opts) {
  if (!observedSockets.has(socket)) {
    observedSockets.add(socket);
    // try to initially set up connection
    // info for the socket. it's likely
    // empty right now
    info.setConnection(socket, opts);
    //  start listening to events that
    // tell details about the socket
    monitorSocket(socket);
  }
}

function preciseTime () {
  const time = process.hrtime(baseHrtime);
  return baseCreatedAt + (time[0] * 1000) + (time[1] / 1000000);
}

function log (socket, eventType, data) {
  const event = {
    [eventType]: toString(data),
    created_at: preciseTime()
  };
  state.forEach(asyncState => {
    const log = getLog(asyncState, socket);
    log.events.push(event);
  });
}

function toString (data) {
  if (Buffer.isBuffer(data) || typeof data === 'string') {
    return data.toString();
  } else {
    return JSON.stringify(data);
  }
}
