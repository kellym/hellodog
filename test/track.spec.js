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
  a.get('/hello', (req, res) => {
    res.header('Content-length', 13);
    res.write('Hello, world!');
    res.end();
  });
  return a;
};

test('tracks http socket requests and responses', () => {
  return new Promise(resolve => {
    const server = app().listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      track(done => {
        http.get(`http://127.0.0.1:${port}/hello`, done);
      }, (res, log) => {
        const s = log[0];
        assert.equal(log.length, 1);
        assert(s.events);
        assert.equal(s.events.filter(e => e.type === 'connect').length, 1);
        assert.equal(s.events.filter(e => e.type === 'request').length, 1);
        assert.equal(s.events.filter(e => e.type === 'response').length, 1);
        assert.equal(s.events.length, 3);
        assert(s.connection);
        assert.equal(s.connection.port, port);
        assert.equal(s.connection.host, '127.0.0.1');
        assert.equal(s.connection.path, '/hello');
        assert.equal(s.connection.protocol, 'http:');
        assert.equal(s.source, 'tcp');
        server.close(resolve);
      });
    });
  });
});

test('tracks only what is created inside tracking loop', () => {
  return new Promise((resolve, reject) => {
    console.log('Hello, ');
    track(done => {
      console.log('World!');
      done();
    }, (err, log) => {
      if (err) return reject(err);
      const s = log[0];
      assert.equal(log.length, 1);
      assert.equal(s.events.filter(e => e.type === 'request').length, 1);
      assert.equal(s.events.length, 1);
      assert(s.events[0].data.indexOf('World') !== -1);
      assert.equal(s.source, 'stdout');
      resolve();
    });
  });
});

test('does not track sockets on another callback', () => {
  return new Promise(resolve => {
    let port;
    const app = express();
    app.get('/', (req, res) => {
      res.header('Content-length', 13);
      res.write('Hello, world!');
      console.log('This should be ignored');
      res.end();
    });
    app.get('/track', async (req, res) => {
      // track inside here and make another request to same API
      await track(done => {
        http.get(`http://127.0.0.1:${port}/`, (res) => {
          done();
        });
      }, (err, log) => {
        if (err) throw err;
        res.end();
        server.close(() => {
          assert.equal(log.filter(l => l.source === 'stdout').length, 0);
          resolve();
        });
      });
    });
    const server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      http.get(`http://127.0.0.1:${port}/track`);
    });
  });
});

test('handles the callback syntax', done => {
  const server = app().listen(0, '127.0.0.1', () => {
    track(callback => {
      try {
        http.get(`http://127.0.0.1:${server.address().port}`, (res) => {
          callback(undefined, res);
        });
      } catch (err) {
        callback(err);
      }
    }, (err, res, log) => {
      assert.equal(err, undefined);
      assert(res);
      assert(log[0].events);
      server.close(done);
    });
  });
});

test('tracks https socket requests and responses', async () => {
  return new Promise(resolve => {
    pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
      if (err) console.error(err);
      const server = https.createServer({
        key: keys.serviceKey,
        cert: keys.certificate
      }, app()).listen(0, '127.0.0.1', () => {
        track(done => {
          https.get(`https://127.0.0.1:${server.address().port}`, done);
        }, (res, log) => {
          const s = log[0];
          assert(s.events);
          assert.equal(s.events.length, 5);
          assert.equal(s.events.filter(e => e.type === 'request').length, 1);
          assert.equal(s.events.filter(e => e.type === 'connect').length, 1);
          assert.equal(s.events.filter(e => e.type === 'secureConnect').length, 1);
          const responses = s.events.filter(e => e.type === 'response');
          assert.equal(responses.length, 1);
          assert(responses[0].data.indexOf('200 OK') !== -1);
          assert.equal(s.source, 'tcp');
          server.close(resolve);
        });
      });
    });
  });
});

test('records created_at time', done => {
  const now = (new Date()).getTime();
  setTimeout(async () => {
    const log = await track(done => {
      console.log('Hello, world!');
      done();
    });
    const s = log[0];
    assert(s.events[0].created_at > now, `created_at is greater than now: ${s.events[0].created_at} > ${now}`);
    done();
  }, 10);
});

test('tracks console.log', async () => {
  const log = await track(done => {
    console.log('Hello, world!');
    done();
  });
  const s = log[0];
  assert(s.events);
  assert.equal(s.events.length, 1);
  assert(s.events[0].type === 'request');
  assert.equal(s.source, 'stdout');
});

test('tracks console.error', async () => {
  const log = await track(done => {
    console.error('Hello, world!');
    done();
  });
  const s = log[0];
  assert(s.events);
  assert.equal(s.events.length, 1);
  assert(s.events[0].type === 'request');
  assert.equal(s.source, 'stderr');
});

test('tracks console.log and error separately', async () => {
  const log = await track(done => {
    console.log('Hello, world!');
    console.error('Goodbye, world!');
    done();
  });
  assert.equal(log.length, 2);
  assert.equal(log.map(l => l.source).sort().join(','), 'stderr,stdout');
});

test('does not track after exiting track', async () => {
  const log = await track(() => {
    console.log('Hello, world!');
  });
  console.log('Exit stage left');
  assert.equal(log.length, 1);
  const s = log[0];
  assert(s.events);
  assert.equal(s.events.length, 1);
  assert(s.events[0].type === 'request');
  assert.equal(s.source, 'stdout');
});

test('tracks child processes', async () => {
  const log = await track(done => {
    const ls = spawn('echo', ['Hello, world!']);
    ls.on('close', () => done());
  });
  const s = log[0];
  assert(s.events);
  assert.equal(s.events.length, 1);
  assert(s.events[0].type === 'response');
  assert.equal(s.source, 'pipe');
});

test('passes through done arguments to callback', callback => {
  track(done => {
    console.log('Hello, world!');
    done('foo', 'bar', 'baz');
  }, function (foo, bar, baz, log) {
    assert.equal(foo, 'foo');
    assert.equal(bar, 'bar');
    assert.equal(baz, 'baz');
    assert.equal(log[0].source, 'stdout');
    callback();
  });
});

test('should run as a promise and respect then/catch syntax', callback => {
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
      callback();
    });
  });
});

test('handles using async await syntax', async () => {
  const log = await track(() => {
    console.log('Hello, world!');
  });
  assert.equal(log.length, 1);
  const s = log[0];
  assert(s.events);
  assert.equal(s.events.length, 1);
  assert(s.events[0].type === 'request');
  assert.equal(s.source, 'stdout');
});

test('tracks properly when nested', callback => {
  track(done => {
    console.log('Hello');
    track(done => {
      console.log('World');
      done();
    }, (err, log) => {
      if (err) throw err;
      console.log('!');
      const s = log[0];
      assert.equal(log.length, 1);
      assert.equal(s.events.length, 1);
      done();
    });
  }, (err, log) => {
    if (err) throw err;
    const s = log[0];
    assert.equal(log.length, 1);
    assert.equal(s.events.length, 3);
    callback();
  });
});
