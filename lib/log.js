const merge = require('./merge');
const state = require('./state');
const getLog = require('./getLog');

const baseCreatedAt = (new Date()).getTime();
const baseHrtime = process.hrtime();

module.exports = {
  getLog,

  logEvent (socket, eventType, data, { connection, ...opts } = {}) {
    const event = {
      type: eventType,
      created_at: preciseTime()
    };
    if (data) {
      event.data = toString(data);
    }
    state.forEach(asyncState => {
      const log = getLog(asyncState, socket);
      log.events.push(event);
      if (connection) {
        merge(log.connection, connection);
      }
      merge(log, opts);
    });
  }
};

function preciseTime () {
  const time = process.hrtime(baseHrtime);
  return baseCreatedAt + (time[0] * 1000) + (time[1] / 1000000);
}


function toString (data) {
  if (Buffer.isBuffer(data) || typeof data === 'string') {
    return data.toString();
  } else {
    return JSON.stringify(data);
  }
}
