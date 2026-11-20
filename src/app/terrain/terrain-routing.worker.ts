/// <reference lib="webworker" />
import { TerrainWorkerRequest } from './protocol';
import { TerrainWorkerHost } from './worker-host';

const host = new TerrainWorkerHost((m) => postMessage(m));
addEventListener('message', (e: MessageEvent<TerrainWorkerRequest>) => {
  void host.handle(e.data);
});
