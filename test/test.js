const tap = require('tap');
const record = require('../index').record;
const express = require('express');
const http = require('http');

tap.test('should record http socket requests', (t) => {
  const app = express();
  app.get('/', (req, res) => {
    res.header('Content-length', 13);
    res.write('Hello, world!');
    res.end();
  });
  const server = app.listen(8888, () => {
    record((done) => {
      http.get('http://localhost:8888', done);
    }, (log) => {
      const s = log[0];
      t.ok(s.events);
      t.equal(s.events.length, 2);
      t.equal(s.events.filter(e => e.request).length, 1);
      t.equal(s.events.filter(e => e.response).length, 1);
      t.equal(s.source, 'tcp');
      server.close();
      t.end();
    });
  });
});

tap.test('should record console.log', (t) => {
  record((done) => {
    console.log('Hello, world!');
    done();
  }, (log) => {
    const s = log[0];
    t.ok(s.events);
    t.equal(s.events.length, 1);
    t.ok(s.events[0].request);
    t.equal(s.source, 'stdout');
    t.end();
  });
});

tap.test('should record console.error', (t) => {
  record((done) => {
    console.error('Hello, world!');
    done();
  }, (log) => {
    const s = log[0];
    t.ok(s.events);
    t.equal(s.events.length, 1);
    t.ok(s.events[0].request);
    t.equal(s.source, 'stderr');
    t.end();
  });
});
