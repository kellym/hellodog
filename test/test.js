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
      t.ok(log[0].events);
      t.equal(log[0].source, 'socket');
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
    t.ok(log[0].events);
    t.equal(log[0].source, 'stdout');
    t.end();
  });
});

tap.test('should record console.error', (t) => {
  record((done) => {
    console.error('Hello, world!');
    done();
  }, (log) => {
    t.ok(log[0].events);
    t.equal(log[0].source, 'stderr');
    t.end();
  });
});
