const tap = require('tap');
const net = require('net');
const originalSocket = net.Socket;
const socketLogger = require('../index');

tap.test('should not patch until patch() is called', (t) => {
  t.equal(net.Socket, originalSocket);
  socketLogger.patch();
  t.notEqual(net.Socket, originalSocket);
  t.end();
});

tap.test('should unpatch when unpatch() is called', (t) => {
  socketLogger.patch();
  t.notEqual(net.Socket, originalSocket);
  socketLogger.unpatch();
  t.equal(net.Socket, originalSocket);
  t.end();
});
