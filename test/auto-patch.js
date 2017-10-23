const tap            = require('tap'),
      net            = require('net'),
      originalSocket = net.Socket;

tap.test('should auto-patch when `record` method is retrieved', (t) => {
  delete require.cache[require.resolve('../index.js')];
  t.equal(net.Socket, originalSocket);
  const { record } = require('../index.js');
  t.notEqual(net.Socket, originalSocket);
  t.end();
});
