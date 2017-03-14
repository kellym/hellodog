//
// This is our main function to track the read/write on a socket.
// It runs on a monkey-patched net.Socket, or in the case that
// the monkey-patched constructor is bypassed (i.e. the `net`
// module calls Socket), it runs on `connect`.
//

const _ = require('lodash');
const net = require('net');
const asyncHook = require('async-hook');
const TTYWrap = process.binding('tty_wrap');

// refs to keep state
const refs = new Map();

// placeholder for currently active transactions
let current = {};

class SocketRecorder {
  // automatically wrap net.Socket when this object is created
  constructor() {
    this._wrapSocket();
    this._trackHandles();
  }

  // allow removing the monkey-patch
  restore() {
    this._unwrapSocket();
    this._untrackHandles();
  }

  // record all socket transactions that occur from the start of
  // calling this until callback is called from `fn`
  record(fn, done) {
    let transactions = new Map();
    current.recording = transactions;
    fn(() => {
      current.recording = undefined;
      let recording = Array.from(transactions.values());
      done(recording);
    });
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

  // add hooks to AsyncWrap to keep track of a single request
  // to the API
  _trackHandles() {
    asyncHook.addHooks(this._hooks);
    asyncHook.enable();
  }

  // remove hooks, but don'e disable asyncHook in case another
  // library uses them
  _untrackHandles() {
    asyncHook.removeHooks(this._hooks);
  }

  // these are the hooks used for tracking handles
  get _hooks() {
    return {
      init: this._storeRef,
      pre: this._restoreRef,
      post: this._restoreRef,
      destroy: this._restoreAndCleanrUpRef
    };
  }

  // store a reference to the current transactions by UID
  _storeRef(uid) {
    refs.set(uid, current.recording);
  }

  // restore the current transactions based on UID
  _restoreRef(uid) {
    current.recording = refs.get(uid);
  }

  // restore the transactions, then delete the reference even
  // though we're using a weak map
  _restoreAndCleanUpRef(uid) {
    this._restoreRef(uid);
    refs.delete(uid);
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
      socket._connection = this._getConnection(opts);
    }

    // and start listening to the necessary events to record
    // incoming data
    this._listen(socket);
  }

  _getLog(socket) {
    let log = current.recording.get(socket);
    if (!log) {
      // prepare basic state of transactions we'll log
      log = {
        events: [],
        source: this._getSocketType(socket)
      };
      current.recording.set(socket, log);
    }
    return log;
  }

  _deleteLog(socket) {
    if (current.recording) {
      current.recording.delete(socket);
    }
  }

  _getSocketType(socket) {
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
      created_at: (new Date()).getTime()
    });
  }

  _getConnection(args) {
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
    if (current.recording && (socket.encrypted || !socket.isRawEncryptedStream)) {
      this._log(socket, 'request', data);
    }
    return original.apply(socket, args);
  }

}

module.exports = SocketRecorder;
