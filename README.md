# socket-logger
Log all communication over sockets.

#### Basic usage

```javascript
const record = require('socket-logger').record;

// basic recording of process.stdout
record((done) => {
  console.log('Hello, world!');
  done();
}, (log) => {
  // returns an array of sockets and their messages
});
```

Response from `console.log`:
```javascript
[
  { 
    events: [ 
      { request: 'Hello, world!\n', created_at: 1489460314753 } 
    ],
    source: 'stdout'
  }
]
```


#### More advanced responses

```javascript
const record = require('socket-logger').record;
const express = require('express');

// recording of an HTTP transaction
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
        created_at: 1489460545620 
      },
      { 
        response: 'HTTP/1.1 200 OK\r\nX-Powered-By: Express\r\nContent-length: 13\r\nDate: Tue, 14 Mar 2017 03:02:25 GMT\r\nConnection: close\r\n\r\nHello, world!',
        created_at: 1489460545628 
      } 
    ],
    connection: { 
      host: 'localhost', 
      port: '8888', 
      path: null 
    },
    source: 'socket'
  }
]
```
