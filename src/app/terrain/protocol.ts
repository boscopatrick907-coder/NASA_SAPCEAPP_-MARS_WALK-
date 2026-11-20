/** Terrain contract v1 §6 worker messages. */
import { Point } from '../core/models';
import {
  Geotransform,
  ImageGeoref,
  TERRAIN_CONTRACT_VERSION,
  TerrainFailureCode,
} from '../core/terrain';
import { TerrainRouteMetrics } from './routing';

export type TerrainWorkerRequest =
  | {
      readonly type: 'load';
      readonly contractVersion: typeof TERRAIN_CONTRACT_VERSION;
      readonly packageId: string;
      /** Amendment to the draft: the worker needs the image georeference to snap endpoints. */
      readonly image: ImageGeoref;
      readonly cols: number;
      readonly rows: number;
      readonly geotransform: Geotransform;
      readonly grid: ArrayBuffer;
      readonly mask: ArrayBuffer;
    }
  | {
      readonly type: 'route';
      readonly contractVersion: typeof TERRAIN_CONTRACT_VERSION;
      readonly requestId: string;
      readonly packageId: string;
      readonly imageRef: string;
      readonly start: Point;
      readonly destination: Point;
      readonly maxSegmentGradeDeg: number;
    }
  | { readonly type: 'cancel'; readonly requestId: string };

export type TerrainWorkerResponse =
  | { readonly type: 'loaded'; readonly packageId: string }
  | { readonly type: 'load-failed'; readonly packageId: string; readonly message: string }
  | {
      readonly type: 'result';
      readonly requestId: string;
      readonly packageId: string;
      readonly imageRef: string;
      readonly status: 'preview-ready';
      readonly path: Point[];
      readonly metrics: TerrainRouteMetrics;
    }
  | {
      readonly type: 'result';
      readonly requestId: string;
      readonly packageId: string;
      readonly imageRef: string;
      readonly status: 'no-route' | 'cancelled' | 'error';
      readonly reasonCode: TerrainFailureCode;
      readonly message: string | null;
    };

export type TerrainResult = Extract<TerrainWorkerResponse, { type: 'result' }>;
