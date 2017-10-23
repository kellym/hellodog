const tap            = require('tap'),
      net            = require('net'),
      originalSocket = net.Socket,
      socketRecorder = require('../index');

tap.test('should not patch until patch() is called', (t) => {
  t.equal(net.Socket, originalSocket);
  socketRecorder.patch();
  t.notEqual(net.Socket, originalSocket);
  t.end();
});

tap.test('should unpatch when unpatch() is called', (t) => {
  socketRecorder.patch();
  t.notEqual(net.Socket, originalSocket);
  socketRecorder.unpatch();
  t.equal(net.Socket, originalSocket);
  t.end();
});
