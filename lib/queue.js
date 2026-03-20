/**
 * @file
 * Concurrency-limited queue (semaphore).
 */

/**
 * Creates a concurrency-limited queue.
 *
 * @param {number} limit  Max concurrent operations (0 = unlimited).
 * @return {{ run: (fn: () => Promise<any>) => Promise<any> }}
 */
function createQueue(limit) {
  let active = 0;
  const waiting = [];

  function next() {
    if (waiting.length === 0 || (limit > 0 && active >= limit)) return;
    active++;
    const { fn, resolve, reject } = waiting.shift();
    Promise.resolve()
      .then(fn)
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  }

  return {
    run(fn) {
      return new Promise((resolve, reject) => {
        waiting.push({ fn, resolve, reject });
        next();
      });
    },
  };
}

module.exports = { createQueue };
