const tap        = require('tap'),
      { record } = require('../index'),
      express    = require('express'),
      http       = require('http'),
      https      = require('https'),
      pem        = require('pem');

// we're using a self-signed cert for our tests
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

tap.test('should record http socket requests and responses', (t) => {
  const server = app().listen(8888, '127.0.0.1', () => {
    record((done) => {
      http.get(`http://127.0.0.1:8888`, done);
    }, (res, log) => {
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

tap.test('should record https socket requests and responses', (t) => {
  pem.createCertificate({days:1, selfSigned:true}, (err, keys) => {
    const server = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app()).listen(8888, '127.0.0.1');
    record((done) => {
      https.get('https://127.0.0.1:8888', done);
    }, (res, log) => {
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


tap.test('should pass through done arguments to callback', (t) => {
  record((done) => {
    console.log('Hello, world!');
    done('foo', 'bar', 'baz');
  }, (foo, bar, baz, log) => {
    t.equal(foo, 'foo');
    t.equal(bar, 'bar');
    t.equal(baz, 'baz');
    t.equal(log[0].source, 'stdout');
    t.end();
  });
});

tap.test('should run as a promise and respect then/catch syntax', (t) => {
  record((resolve, reject) => {
    console.log('Hello, world!');
    resolve();
  }).then((log) => {
    t.equal(log[0].source, 'stdout');
    record((resolve, reject) => {
      console.log('Goodbye!');
      reject();
    }).catch((log) => {
      t.equal(log[0].source, 'stdout');
      t.end();
    });
  });
});
