function green (txt) {
  console.log('\x1b[32m+ %s\x1b[0m', txt);
}
function red (txt) {
  console.log('\x1b[31m- %s\x1b[0m', txt);
}

const errors = [];
let only, started;

const queue = [];

function startQueue () {
  if (started) return;
  started = true;
  setTimeout(async () => {
    if (!queue.length) return;
    while (queue.length) {
      const current = queue.shift();
      if (!only || (current[1] === only)) {
        await runTest(current[0], current[1]);
      }
    }
    started = false;
    startQueue();
  }, 1);
}

function test (action, fn) {
  queue.push([action, fn]);
  startQueue();
}

function runTest (action, fn) {
  return new Promise(async resolve => { // eslint-disable-line no-async-promise-executor
    let resolved = false;
    try {
      await fn((...args) => { resolved = true; resolve(...args); });
      green(action);
    } catch (e) {
      errors.push([action, e]);
      red(action);
    }
    if (!resolved && fn.length === 0) resolve();
  });
}

test.only = function (action, fn) {
  only = fn;
  return test(action, fn);
};

test.skip = function () {
};

process.on('beforeExit', function () {
  console.log(`\n${errors.length} error${errors.length === 1 ? '' : 's'}`);
  errors.forEach(e => {
    red(`${e[0]}\n${e[1].stack}`);
  });

  if (errors.length) process.exit(1);
});
process.on('unhandledRejection', function (reason) {
  errors.push(reason);
});

module.exports.test = test;
