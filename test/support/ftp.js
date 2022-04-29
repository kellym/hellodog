const ftpd = require('ftpd');
const FS = require('fs-mock');

module.exports = function (options) {
  const server = new ftpd.FtpServer(options.host || '127.0.0.1', {
    getInitialCwd () { return '/'; },
    getRoot () { return '/'; },
    pasvPortRangeStart: 1025,
    pasvPortRangeEnd: 1050,
    tlsOptions: options.tls,
    tlsOnly: options.tlsOnly,
    allowUnauthorizedTls: true,
    useWriteFile: true,
    useReadFile: false,
    uploadMaxSlurpSize: 7000
  });

  server.on('error', error => console.log('FTP Server error:', error));

  server.on('client:connected', connection => {
    let username = null;
    connection.on('command:user', function (user, success, failure) {
      if (user && (!options.user || (user === options.user))) {
        username = user;
        success();
      } else {
        failure();
      }
    });

    connection.on('command:pass', (pass, success, failure) => {
      if (pass && (!options.password || (pass === options.password))) {
        success(username, options.fs || new FS());
      } else {
        failure();
      }
    });
  });

  server.listen(options.port || 7002);

  return server;
};
