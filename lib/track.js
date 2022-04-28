//
// This is our main function to track the read/write on a socket.
// It runs on a monkey-patched net.Socket, or in the case that
// the monkey-patched constructor is bypassed (i.e. the `net`
// module calls Socket), it runs on `connect`.
//

const { run } = require('./state');

const AsyncFunction = async function () {}.constructor;

// track all socket transactions that occur from the start of
// calling this until callback is called from `fn`
module.exports = function track (fn, callback) {
  const transactions = new Map();

  return new Promise((resolve, reject) => {
    let result;
    function onComplete (err, ...args) {
      if (result) resolve(result);
      const recording = Array.from(transactions.values());
      if (callback) {
        result = callback(err, ...args, recording);
      } else {
        result = recording;
        if (err instanceof Error) reject(err, result);
        else resolve(result);
      }
    }

    run(transactions, async () => {
      if (fn.length === 0) {
        if (fn instanceof AsyncFunction) {
          fn().then(onComplete).catch(onComplete);
        } else {
          onComplete(undefined, fn());
        }
      } else {
        await fn(onComplete, onComplete);
      }
    });
  });
};
