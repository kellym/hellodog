const { test } = require('./helpers');
const assert = require('assert').strict;
const net = require('net');
const originalSocket = net.Socket;
const HelloDog = require('../index');

test('should auto-patch when `track` method is retrieved', () => {
  assert.equal(net.Socket, originalSocket);
  const { track } = HelloDog; // eslint-disable-line no-unused-vars
  assert.notEqual(net.Socket, originalSocket);
});
