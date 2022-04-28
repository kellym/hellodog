// This is a basic single-level merge that doesn't replace
// properties if the source object's property is undefined
module.exports = function merge (target, ...sources) {
  if (!target) return;
  sources.forEach(source => {
    if (!source) return;
    for (const prop in source) {
      if (Object.prototype.hasOwnProperty.call(source, prop) && typeof source[prop] !== 'undefined') {
        target[prop] = source[prop];
      }
    }
  });
  return target;
};
