import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
test('an active production simulation can be terminated before a result is committed', async () => {
  const target = new URL('../src/workers/simulation.worker.ts', import.meta.url).href;
  const worker = new Worker(
    `const {parentPort}=require('node:worker_threads');globalThis.self={postMessage:value=>parentPort.postMessage(value)};import(${JSON.stringify(target)}).then(()=>parentPort.on('message',data=>self.onmessage({data}))).then(()=>parentPort.postMessage({type:'ready'}));`,
    { eval: true },
  );
  const messages = [];
  try {
    await new Promise((resolve, reject) => {
      worker.on('error', reject);
      worker.on('message', (message) => {
        messages.push(message);
        if (message.type === 'ready')
          worker.postMessage({
            players: 9,
            unit: 5,
            weights: [100, 1, 1, 1, 1, 1, 1, 1, 1],
            seed: 20261107,
            trials: 20000,
            chopRate: 0.5,
          });
        if (message.type === 'progress') resolve();
      });
    });
    const exit = await worker.terminate();
    assert.equal(exit, 1);
    assert.ok(messages.some((m) => m.type === 'progress'));
    assert.ok(!messages.some((m) => m.type === 'result'));
  } finally {
    await worker.terminate();
  }
});
