function green (txt) {
  console.log('\x1b[32m+ %s\x1b[0m', txt);
}
function red (txt) {
  console.error('\x1b[31m- %s\x1b[0m', txt);
}

const errors = [];
let only;
async function test (action, fn) {
  return new Promise(resolve => {
    setTimeout(async () => {
      if (only && (only !== fn)) return;
      try {
        await fn();
        green(action);
      } catch (e) {
        errors.push([action, e]);
        red(action);
      }
      resolve();
    }, 1);
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

module.exports.test = test;
