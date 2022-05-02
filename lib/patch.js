const net = require('net');
const wrap = require('./wrap');
const merge = require('./merge');

let isPatched = false;
let wrappedMethods = {};

module.exports = {
  patch () {
    if (!isPatched) {
      isPatched = true;
      const _prototype = net.Socket.prototype;
      wrapMethod(net, 'Socket', wrap.socket);
      net.Socket.prototype = _prototype;
      wrapMethod(_prototype, 'connect', wrap.connect);
      wrapMethod(_prototype, '_writeGeneric', wrap.writeGeneric);
      wrapMethod(_prototype, 'push', wrap.push);
      wrapMethod(_prototype, 'emit', wrap.emit);
    }
  },

  unpatch () {
    if (isPatched) {
      isPatched = false;
      net.Socket = wrappedMethods.Socket;
      net.Socket.prototype.connect = wrappedMethods.connect;
      net.Socket.prototype._writeGeneric = wrappedMethods._writeGeneric;
      net.Socket.prototype.push = wrappedMethods.push;
      net.Socket.prototype.emit = wrappedMethods.emit;
      wrappedMethods = {};
    }
  }
};

function wrapMethod (object, fnName, fn) {
  const self = this;
  const original = object[fnName];
  wrappedMethods[fnName] = original;
  const wrapped = function (...args) {
    return fn.call(self, this, original, args);
  };
  merge(wrapped, original);
  object[fnName] = wrapped;
}
