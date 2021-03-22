const tap            = require('tap'),
      net            = require('net'),
      originalSocket = net.Socket,
      HelloDog       = require('../index');

tap.test('should not patch until patch() is called', (t) => {
  t.equal(net.Socket, originalSocket);
  HelloDog.patch();
  t.notEqual(net.Socket, originalSocket);
  t.end();
});

tap.test('should unpatch when unpatch() is called', (t) => {
  HelloDog.patch();
  t.notEqual(net.Socket, originalSocket);
  HelloDog.unpatch();
  t.equal(net.Socket, originalSocket);
  t.end();
});
