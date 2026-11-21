import { Injectable, signal } from '@angular/core';
import { Point } from './models';

/**
 * Map-facing terrain suggestion (Planning V2). Kept tiny so the map, which loads eagerly,
 * doesn't pull the terrain loader, routing client or worker into the initial bundle.
 * Written only by TerrainPreviewService with an already-guarded path (or null).
 */
@Injectable({ providedIn: 'root' })
export class TerrainSuggestionStore {
  private readonly pathState = signal<readonly Point[] | null>(null);
  readonly path = this.pathState.asReadonly();
  set(path: readonly Point[] | null): void {
    this.pathState.set(path ? path.map((p) => ({ x: p.x, y: p.y })) : null);
  }
}
