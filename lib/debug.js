const fs = require('fs');
const util = require('util');

module.exports = function debug (...args) {
  fs.writeFileSync(1, `${util.format(...args)}\n`, { flag: 'a' });
};
