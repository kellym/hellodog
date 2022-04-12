const { test } = require('./helpers');
const assert = require('assert').strict;
const net = require('net');
const originalSocket = net.Socket;

test('should auto-patch when `track` method is retrieved', () => {
  delete require.cache[require.resolve('../index.js')];
  assert.equal(net.Socket, originalSocket);
  const { track } = require('../index.js'); // eslint-disable-line no-unused-vars
  assert.notEqual(net.Socket, originalSocket);
});
