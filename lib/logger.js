//
// This is our main function to track the read/write on a socket.
// It runs on a monkey-patched net.Socket, or in the case that
// the monkey-patched constructor is bypassed (i.e. the `net`
// module calls Socket), it runs on `connect`.
//

const _ = require('lodash');
const net = require('net');
const state = require('./state');
const info = require('./info');

class SocketLogger {
  // automatically wrap net.Socket when this object is created
  constructor() {
    this.base_created_at = (new Date()).getTime();
    this.base_hrtime = process.hrtime();
    this._wrapSocket();
    state.track();
  }

  // allow removing the monkey-patch
  restore() {
    this._unwrapSocket();
    state.untrack();
  }

  // record all socket transactions that occur from the start of
  // calling this until callback is called from `fn`
  record(fn, done) {
    let transactions = state.create();
    fn(() => {
      state.reset();
      let recording = Array.from(transactions.values());
      done(recording);
    });
  }

  _time() {
    let time = process.hrtime(this.base_hrtime);
    return this.base_created_at + (time[0] * 1000) + (time[1] / 1000000);
  }

  // monkey-patch net.Socket
  _wrapSocket() {
    let _prototype = net.Socket.prototype;
    this._wrapMethod(net, 'Socket', this._socket);
    net.Socket.prototype = _prototype;
    this._wrapMethod(net.Socket.prototype, 'connect', this._connect);
    this._wrapMethod(net.Socket.prototype, '_writeGeneric', this._writeGeneric);
  }

  // un-monkey-patch net.Socket
  _unwrapSocket() {
    if (typeof net.Socket._unwrap === 'function') {
      net.Socket._unwrap();
      net.Socket.prototype.connect._unwrap();
      net.Socket.prototype._writeGeneric._unwrap();
    }
  }

  // replace a method with another version, retaining `this` and
  // supplying the new state and original method
  _wrapMethod(object, method, fn) {
    const self = this;
    const original = _.get(object, method);
    const wrapped = function(...args) { return fn.call(self, original, this, args); };
    wrapped._unwrap = () => _.set(object, method, original);
    _.set(object, method, wrapped);
  }

  // this sets up the recording on a particular socket,
  // as intitialized from either a new Socket or socket.connect
  _startRecordingSocket(socket, opts) {

    if (!socket._connection) {
      socket._connection = info.connection(opts);
    }

    // and start listening to the necessary events to record
    // incoming data
    this._listen(socket);

  }

  _getLog(socket) {
    let log = state.current && state.current.get(socket);
    if (!log) {
      // prepare basic state of transactions we'll log
      log = {
        events: [],
        source: info.socketType(socket)
      };
      if (state.current) state.current.set(socket, log);
    }
    log.connection = socket._connection;
    return log;
  }

  _deleteLog(socket) {
    if (state.current) {
      state.current.delete(socket);
    }
  }

  _listen(socket) {

    if (socket._listening) return;

    socket._listening = true;

    // when the socket registers as secure, let's track that for our log
    socket.on('secure', () => {
      this._getLog(socket).encrypted = true;
    });

    // ensure on connect that if this is encrypted, it tries to retrieve
    // the parent socket's connection information
    socket.on('connect', (err, req) => {
      if (socket._parent) {
        let log = this._getLog(socket);
        let parentLog = this._getLog(socket._parent);
        if (parentLog.connection) {
          log.connection = _.extend(log.connection || {}, parentLog.connection);
        }
      }
    });

    // an encrypted stream doesn't reveal itself to be encrypted, and a
    // decrypted stream sets the `encrypted` property to true, so we'll
    // use an unlikely name to track a stream we should discard
    socket.once('data', function(data) {
      if (data[0] === 0x16 || data[0] === 0x80 || data[0] === 0x00) {
        socket.isRawEncryptedStream = true;
        this._deleteLog(socket);
      }
    });


    // start recording all the response data from a server
    socket.on('data', (data) => {
      if (!socket._securePending && (socket.encrypted || !socket.isRawEncryptedStream)) {
        this._log(socket, 'response', data);
      }
    });

    // make sure our event listeners don't cause the process to hang
    // when the process is done with this socket
    socket.unref();

  }

  _log(socket, event, data) {
    let log = this._getLog(socket);
    log.events.push({
      [event]: data.toString(),
      created_at: this._time()
    });
  }

  _socket(original, socket, args) {
    original.apply(socket, args);
    this._startRecordingSocket(socket, args);
    return socket;
  }

  _connect(original, socket, args) {
    this._startRecordingSocket(socket, args);
    return original.apply(socket, args);
  }

  _writeGeneric(original, socket, args) {
    // args: writev, data, encoding, callback
    let data = args[1];
    // if the socket is the encrypted one that we write decrypted data to,
    // or it's generally just not a raw encrypted stream that still needs
    // decryption, we can log this
    if (!socket.connecting && socket._handle && state.current && (socket.encrypted || !socket.isRawEncryptedStream)) {
      this._log(socket, 'request', data);
    }
    return original.apply(socket, args);
  }

}

module.exports = SocketLogger;
