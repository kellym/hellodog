const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let status = 0;
fs.readdir(__dirname, (err, files) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  files.forEach(file => {
    if (file.indexOf('.spec') === -1) return;
    const out = spawnSync('node', [path.join(__dirname, file)]);
    console.log(out.output[1].toString());
    if (out.output[2]) {
      console.error(out.output[2].toString());
    }
    if (out.status !== 0) status = out.status;
  });

  process.exit(status);
});
