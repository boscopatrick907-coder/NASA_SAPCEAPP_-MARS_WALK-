// Worker host + client lifecycle tests. Synthetic grids are test fixtures only.
import { Geotransform, ImageGeoref } from '../core/terrain';
import { TerrainWorkerRequest, TerrainWorkerResponse } from './protocol';
import { ClientEvent, TerrainRoutingClient, WorkerLike } from './terrain-routing.client';
import { TerrainWorkerHost } from './worker-host';

const image: ImageGeoref = {
  imageRef: 'img',
  width: 400,
  height: 400,
  pixelSizeMeters: 0.25,
  xminMeters: 0,
  yminMeters: 0,
};
const gt: Geotransform = [0, 1, 0, 100, 0, -1];
const N = 100;
const buffers = () => ({
  grid: new Float32Array(N * N).buffer,
  mask: new Uint8Array(N * N).fill(1).buffer,
});
const load = (packageId = 'pkg'): TerrainWorkerRequest => ({
  type: 'load',
  contractVersion: 'terrain-v1',
  packageId,
  image,
  cols: N,
  rows: N,
  geotransform: gt,
  ...buffers(),
});
const route = (
  requestId: string,
  over: Partial<Extract<TerrainWorkerRequest, { type: 'route' }>> = {},
): TerrainWorkerRequest => ({
  type: 'route',
  contractVersion: 'terrain-v1',
  requestId,
  packageId: 'pkg',
  imageRef: 'img',
  start: { x: 1, y: 1 },
  destination: { x: 399, y: 399 },
  maxSegmentGradeDeg: 15,
  ...over,
});

describe('TerrainWorkerHost', () => {
  let out: TerrainWorkerResponse[];
  let host: TerrainWorkerHost;
  beforeEach(() => {
    out = [];
    host = new TerrainWorkerHost((m) => out.push(m), { chunk: 50 });
  });

  it('loads, routes and returns a preview', async () => {
    host.handle(load());
    await host.handle(route('r1'));
    expect(out[0]).toEqual({ type: 'loaded', packageId: 'pkg' });
    expect(out[1]).toMatchObject({ type: 'result', requestId: 'r1', status: 'preview-ready' });
  });

  it('rejects bad loads: size, contract and grid/mask disagreement', () => {
    host.handle({ ...load(), cols: N + 1 } as TerrainWorkerRequest);
    host.handle({ ...load(), contractVersion: 'v1-proposal' } as unknown as TerrainWorkerRequest);
    const b = buffers();
    new Uint8Array(b.mask)[0] = 0; // mask invalid but grid is 0, not NaN
    host.handle({ ...load(), ...b });
    expect(out.map((m) => m.type)).toEqual(['load-failed', 'load-failed', 'load-failed']);
  });

  it('refuses routes for an unloaded package or a different image', async () => {
    await host.handle(route('r0'));
    host.handle(load());
    await host.handle(route('r1', { imageRef: 'other' }));
    expect(out[0]).toMatchObject({ status: 'error', reasonCode: 'no-terrain-package' });
    expect(out[2]).toMatchObject({ status: 'error', reasonCode: 'image-ref-mismatch' });
  });

  it('cancels between chunks', async () => {
    host.handle(load());
    const running = host.handle(route('r1'));
    host.handle({ type: 'cancel', requestId: 'r1' });
    await running;
    expect(out[1]).toMatchObject({ requestId: 'r1', status: 'cancelled', reasonCode: 'cancelled' });
  });

  it('a newer route supersedes the running one', async () => {
    host.handle(load());
    const first = host.handle(route('r1'));
    const second = host.handle(route('r2'));
    await Promise.all([first, second]);
    const results = out.filter((m) => m.type === 'result');
    expect(results.find((m) => m.requestId === 'r1')).toMatchObject({ status: 'cancelled' });
    expect(results.find((m) => m.requestId === 'r2')).toMatchObject({ status: 'preview-ready' });
  });
});

/** In-process fake worker wired to a real host, delivering messages asynchronously. */
class FakeWorker implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  onerror: WorkerLike['onerror'] = null;
  terminated = false;
  readonly sent: TerrainWorkerRequest[] = [];
  private readonly host = new TerrainWorkerHost(
    (m) => queueMicrotask(() => this.onmessage?.({ data: m } as MessageEvent)),
    {
      chunk: 50,
    },
  );
  postMessage(m: TerrainWorkerRequest) {
    this.sent.push(m);
    void this.host.handle(m);
  }
  terminate() {
    this.terminated = true;
  }
}

describe('TerrainRoutingClient', () => {
  let events: ClientEvent[];
  let worker: FakeWorker;
  let client: TerrainRoutingClient;
  let n = 0;
  const settle = () => new Promise((r) => setTimeout(r, 30));
  const input = {
    packageId: 'pkg',
    imageRef: 'img',
    start: { x: 1, y: 1 },
    destination: { x: 399, y: 399 },
    maxSegmentGradeDeg: 15,
  };

  beforeEach(() => {
    events = [];
    client = new TerrainRoutingClient(
      () => (worker = new FakeWorker()),
      (e) => events.push(e),
      () => `id${++n}`,
    );
    const b = buffers();
    client.load('pkg', image, N, N, gt, b.grid, b.mask);
  });

  it('delivers the matching result once', async () => {
    const id = client.request(input);
    await settle();
    expect(events.filter((e) => e.kind === 'result')).toHaveLength(1);
    expect(events.find((e) => e.kind === 'result')).toMatchObject({
      result: { requestId: id, status: 'preview-ready' },
    });
  });

  it('treats results after an endpoint change as stale and cancels the worker request', async () => {
    const id = client.request(input);
    client.invalidateIfChanged({ ...input, destination: { x: 200, y: 200 } });
    await settle();
    expect(worker.sent.some((m) => m.type === 'cancel' && m.requestId === id)).toBe(true);
    expect(events.some((e) => e.kind === 'result')).toBe(false);
    expect(events).toContainEqual({ kind: 'stale', requestId: id });
  });

  it('ignores unchanged state and grade changes are detected', async () => {
    client.request(input);
    client.invalidateIfChanged({ ...input });
    await settle();
    expect(events.some((e) => e.kind === 'result')).toBe(true);
    const id2 = client.request(input);
    client.invalidateIfChanged({ ...input, maxSegmentGradeDeg: 16 });
    await settle();
    expect(events).toContainEqual({ kind: 'stale', requestId: id2 });
  });

  it('only the latest of two requests produces a result', async () => {
    const a = client.request(input);
    const b = client.request({ ...input, maxSegmentGradeDeg: 20 });
    await settle();
    const results = events.filter((e) => e.kind === 'result');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ result: { requestId: b } });
    expect(events).toContainEqual({ kind: 'stale', requestId: a });
  });

  it('worker crash reports an error and terminates', () => {
    const id = client.request(input);
    worker.onerror?.({ message: 'boom' } as ErrorEvent);
    expect(events).toContainEqual({ kind: 'worker-error', requestId: id, message: 'boom' });
    expect(worker.terminated).toBe(true);
  });
});
