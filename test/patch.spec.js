const { test } = require('./helpers');
const assert = require('assert').strict;
const net = require('net');
const originalSocket = net.Socket;
const { patch, unpatch } = require('../index');

test('should not patch until patch() is called', () => {
  assert.equal(net.Socket, originalSocket);
  patch();
  assert.notEqual(net.Socket, originalSocket);
  unpatch();
});

test('should unpatch when unpatch() is called', () => {
  patch();
  assert.notEqual(net.Socket, originalSocket);
  unpatch();
  assert.equal(net.Socket, originalSocket);
});
