/**
 * @file
 * Unit tests for createQueue in lib/queue.js.
 */

const assert = require('assert');
const { createQueue } = require('../../lib/queue');

/** Returns a Promise that resolves after `ms` milliseconds. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

suite('createQueue()', function () {
  test('single task resolves with its return value', async function () {
    const queue = createQueue(1);
    const result = await queue.run(() => Promise.resolve(42));
    assert.strictEqual(result, 42);
  });

  test('limit=1: second task waits for first (order preserved)', async function () {
    const queue = createQueue(1);
    const order = [];

    await Promise.all([
      queue.run(async () => {
        await delay(20);
        order.push(1);
      }),
      queue.run(async () => {
        order.push(2);
      }),
    ]);

    assert.deepStrictEqual(order, [1, 2]);
  });

  test('limit=2: max concurrency is 2', async function () {
    const queue = createQueue(2);
    let active = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 4 }, () =>
      queue.run(async () => {
        active++;
        if (active > maxConcurrent) maxConcurrent = active;
        await delay(10);
        active--;
      }),
    );

    await Promise.all(tasks);
    assert.strictEqual(maxConcurrent, 2);
  });

  test('limit=0: all tasks run simultaneously', async function () {
    const queue = createQueue(0);
    let active = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 5 }, () =>
      queue.run(async () => {
        active++;
        if (active > maxConcurrent) maxConcurrent = active;
        await delay(10);
        active--;
      }),
    );

    await Promise.all(tasks);
    assert.strictEqual(maxConcurrent, 5);
  });

  test('failed task propagates the error via rejection', async function () {
    const queue = createQueue(1);
    await assert.rejects(
      () => queue.run(() => Promise.reject(new Error('boom'))),
      /boom/,
    );
  });

  test('queue continues processing after a task fails', async function () {
    const queue = createQueue(1);

    await assert.rejects(
      () => queue.run(() => Promise.reject(new Error('fail'))),
      /fail/,
    );

    const result = await queue.run(() => Promise.resolve('ok'));
    assert.strictEqual(result, 'ok');
  });

  test('Promise.all results match submission order', async function () {
    const queue = createQueue(2);

    const [a, b, c] = await Promise.all([
      queue.run(() => Promise.resolve(1)),
      queue.run(() => Promise.resolve(2)),
      queue.run(() => Promise.resolve(3)),
    ]);

    assert.strictEqual(a, 1);
    assert.strictEqual(b, 2);
    assert.strictEqual(c, 3);
  });
});
