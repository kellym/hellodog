# Hello, Dog!
There are libraries out there that record HTTP transactions. 
There's [yakbak](https://github.com/flickr/yakbak) and
[sepia](https://github.com/LinkedInAttic/sepia), to name a couple.

This library is different. This library records and logs _all_ communication over sockets, 
not just sockets used for HTTP transactions.

What happens over sockets, you ask? Let's name a few:

- HTTP transactions
- HTTPS transactions
- FTP transactions
- WebSockets
- `stdin`, `stdout`, and `stderr` (this means you can track `console.log`!)
- and many more!

![Build Status](https://github.com/kellym/hellodog/actions/workflows/test.yml/badge.svg)

## Quick Start

#### Patching Socket
When using HelloDog, net.Socket needs to be patched before anything else
extends or creates a Socket in order for that to be recorded. Patching can be
done by either calling `patch()` or by assigning `track`:

```javascript
// automatically patches when retrieving the track method:
const { track } = require('hellodog');

// or more explicitly:
require('hellodog').patch();

// net Socket can also be unpatched:
require('hellodog').unpatch();
```

#### Basic usage

```javascript
const { track } = require('hellodog');

// basic recording of process.stdout
track((done) => {
  console.log('Hello, dog!');
  console.log('Goodbye, dog!');
  done();
}, (log) => {
  // returns an array of sockets and their messages
});

// or use it as a Promise
track((resolve, reject) => {
  console.log('I promise!');
  resolve();
}).then((log) => {

});

const log = await track(fnCall);
```

Response from `console.log`:
```javascript
[
  {
    events: [
      { request: 'Hello, dog!\n', created_at: 1489460314753.3242 },
      { request: 'Goodbye, dog!\n', created_at: 1489460314753.4758 }
    ],
    source: 'stdout'
  }
]
```


#### More advanced responses

```javascript
const { track } = require('hellodog');
const express = require('express');

// recording of an HTTP transaction
const app = express();
app.get('/', (req, res) => {
  res.header('Content-length', 13);
  res.write('Hello, world!');
  res.end();
});
const server = app.listen(8888, () => {
  track((done) => {
    http.get('http://localhost:8888', done);
  }, (log) => {
    // returns an array of sockets and their messages,
    // both request and response
    server.close();
  });
});
```
Response from HTTP transaction:
```javascript
[
  {
    events: [
      {
        request: 'GET / HTTP/1.1\r\nHost: localhost:8888\r\nConnection: close\r\n\r\n',
        created_at: 1489460545620.1575
      },
      {
        response: 'HTTP/1.1 200 OK\r\nX-Powered-By: Express\r\nContent-length: 13\r\nDate: Tue, 14 Mar 2017 03:02:25 GMT\r\nConnection: close\r\n\r\nHello, world!',
        created_at: 1489460545628.0654
      }
    ],
    connection: {
      host: 'localhost',
      port: '8888'
    },
    source: 'tcp'
  }
]
```

### Why Dog?

Dogs have both an excellent memory and excellent hearing. We need both.
