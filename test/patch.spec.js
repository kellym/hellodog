const { test } = require('./helpers');
const assert = require('assert').strict;
const net = require('net');
const originalSocket = net.Socket;
const state = require('../lib/state');
const HelloDog = require('../index');

test('should not patch until patch() is called', () => {
  assert.equal(net.Socket, originalSocket);
  HelloDog.patch();
  assert.notEqual(net.Socket, originalSocket);
});

test('should unpatch when unpatch() is called', () => {
  HelloDog.patch();
  assert.notEqual(net.Socket, originalSocket);
  HelloDog.unpatch();
  assert.equal(net.Socket, originalSocket);
});

test('should start tracking state when patch() is called', () => {
  let isTracking = false;
  const original = state.track;
  state.track = () => { isTracking = true; state.track = original; };
  HelloDog.patch();
  assert(isTracking);
});

test('should stop tracking state when unpatch() is called', () => {
  let isTracking = true;
  const original = state.untrack;
  state.untrack = () => { isTracking = false; state.untrack = original; };
  HelloDog.unpatch();
  assert(!isTracking);
});
