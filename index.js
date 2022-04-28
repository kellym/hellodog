const { patch, unpatch } = require('./lib/patch');
const track = require('./lib/track');

module.exports = {
  get track () {
    patch();
    return track;
  },
  patch,
  unpatch
};
