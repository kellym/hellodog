const { test } = require('./helpers');
const assert = require('assert').strict;
const { track } = require('../index');
const FtpServer = require('./support/ftp');
const FtpClient = require('ftp');
const getPort = require('./support/get-port');

test('tracks ftp server', async done => {
  const port = await getPort();
  const options = {
    port,
    host: '127.0.0.1',
    user: 'andrew',
    password: 'bird'
  };
  const server = FtpServer(options);

  const log = await track(callback => {
    const client = new FtpClient();
    client.on('ready', () => {
      client.put('MyInformation', 'data.txt', (err) => {
        client.end();
        server.close();
        callback(err);
      });
    });
    client.on('error', (err) => {
      done(err);
    });
    client.connect(options);
  });
  assert.equal(log.length, 2);
  assert.equal(log[0].events.filter(e => e.type === 'request' && e.data.indexOf(options.user) !== -1).length, 1);
  assert.equal(log[0].events.filter(e => e.type === 'request' && e.data.indexOf(options.password) !== -1).length, 1);
});
