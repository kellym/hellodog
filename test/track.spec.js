const { test } = require('./helpers');
const assert = require('assert').strict;
const { track } = require('../index');
const { spawn } = require('child_process');
const express = require('express');
const http = require('http');
const https = require('https');
const pem = require('pem');

// we're using a self-signed cert for our tests.
// important: must run tests with environment variable
// NODE_NODE_WARNINGS = 1
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const app = () => {
  const a = express();
  a.get('/', (req, res) => {
    res.header('Content-length', 13);
    res.write('Hello, world!');
    res.end();
  });
  return a;
};

test('should track http socket requests and responses', () => {
  const server = app().listen(8888, '127.0.0.1', () => {
    track(done => {
      http.get('http://127.0.0.1:8888', done);
    }, (res, log) => {
      const s = log[0];
      assert(s.events);
      assert.equal(s.events.filter(e => e.request).length, 1);
      assert.equal(s.events.filter(e => e.response).length, 1);
      assert.equal(s.events.length, 2);
      assert.equal(s.source, 'tcp');
      server.close();
    });
  });
});

test('should track https socket requests and responses', () => {
  pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
    if (err) console.error(err);
    const server = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app()).listen(8888, '127.0.0.1');
    track(done => {
      https.get('https://127.0.0.1:8888', done);
    }, (res, log) => {
      const s = log[0];
      assert(s.events);
      assert.equal(s.events.filter(e => e.request).length, 1);
      assert.equal(s.events.filter(e => e.response).length, 1);
      assert.equal(s.events.length, 2);
      assert.equal(s.source, 'tcp');
      server.close();
    });
  });
});

test('should track console.log', () => {
  track(done => {
    console.log('Hello, world!');
    done();
  }, log => {
    const s = log[0];
    assert(s.events);
    assert.equal(s.events.length, 1);
    assert(s.events[0].request);
    assert.equal(s.source, 'stdout');
  });
});

test('should track console.error', () => {
  track(done => {
    console.error('Hello, world!');
    done();
  }, log => {
    const s = log[0];
    assert(s.events);
    assert.equal(s.events.length, 1);
    assert(s.events[0].request);
    assert.equal(s.source, 'stderr');
  });
});

test('should track child processes', async () => {
  const log = await track(done => {
    const ls = spawn('echo', ['Hello, world!']);
    ls.on('close', () => done());
  });
  const s = log[0];
  assert(s.events);
  assert.equal(s.events.length, 1);
  assert(s.events[0].response);
  assert.equal(s.source, 'pipe');
});

test('should pass through done arguments to callback', () => {
  track((done) => {
    console.log('Hello, world!');
    done('foo', 'bar', 'baz');
  }, (foo, bar, baz, log) => {
    assert.equal(foo, 'foo');
    assert.equal(bar, 'bar');
    assert.equal(baz, 'baz');
    assert.equal(log[0].source, 'stdout');
  });
});

test('should run as a promise and respect then/catch syntax', () => {
  track((resolve, reject) => {
    console.log('Hello, world!');
    resolve();
  }).then(log => {
    assert.equal(log[0].source, 'stdout');
    track((resolve, reject) => {
      console.log('Goodbye!');
      reject();
    }).catch(log => {
      assert.equal(log[0].source, 'stdout');
    });
  });
});
