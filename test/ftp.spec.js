const { test } = require('./helpers');
const assert = require('assert').strict;
const { track } = require('../index');
const FtpServer = require('./support/ftp');
const FtpClient = require('ftp');
const getPort = require('./support/get-port');

test('tracks ftp server', done => {
  getPort().then(async port => {
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
    assert.equal(log[0].events.filter(e => e.request && e.request.indexOf(options.user) !== -1).length, 1);
    assert.equal(log[0].events.filter(e => e.request && e.request.indexOf(options.password) !== -1).length, 1);
  });
});
