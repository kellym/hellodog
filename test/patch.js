const tap            = require('tap'),
      net            = require('net'),
      originalSocket = net.Socket,
      state          = require('../lib/state'),
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

tap.test('should start tracking state when patch() is called', (t) => {
  let isTracking = false;
  let original = state.track;
  state.track = () => { isTracking = true; state.track = original; }
  HelloDog.patch();
  t.ok(isTracking);
  t.end();
});

tap.test('should stop tracking state when unpatch() is called', (t) => {
  let isTracking = true;
  let original = state.untrack;
  state.untrack = () => { isTracking = false; state.untrack = original; }
  HelloDog.unpatch();
  t.notOk(isTracking);
  t.end();
});
