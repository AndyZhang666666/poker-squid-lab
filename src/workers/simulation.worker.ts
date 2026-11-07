import { simulate, type SimulationInput } from '../lib/simulation';
self.onmessage = (event: MessageEvent<SimulationInput>) => {
  try {
    const result = simulate(event.data, (done) => self.postMessage({ type: 'progress', done }));
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', message: (error as Error).message });
  }
};
