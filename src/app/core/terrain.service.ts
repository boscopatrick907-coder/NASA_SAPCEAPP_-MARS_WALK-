/**
 * Terrain contract v1 runtime state (§3, §4, §7). Loads the build's active package
 * pointer, validates the manifest, verifies every file's bytes and hash, and exposes
 * the single gate. Started on demand by the planner integration, not at app startup.
 */
import { computed, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MissionService } from './mission.service';
import {
  terrainGate,
  TerrainManifest,
  terrainReadiness,
  TerrainReadiness,
  validTerrainIndex,
  validTerrainManifest,
} from './terrain';

export type TerrainLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class TerrainService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly mission = inject(MissionService);

  private readonly statusState = signal<TerrainLoadStatus>('idle');
  private readonly manifestState = signal<TerrainManifest | null>(null);
  private readonly readinessState = signal<TerrainReadiness>('unavailable');
  private readonly messageState = signal<string | null>(null);
  private buffers: { grid: ArrayBuffer; mask: ArrayBuffer } | null = null;
  private loading?: Promise<void>;

  readonly status = this.statusState.asReadonly();
  readonly manifest = this.manifestState.asReadonly();
  readonly readiness = this.readinessState.asReadonly();
  readonly message = this.messageState.asReadonly();
  /** null when terrain routing may be offered; otherwise the reason (contract §4). */
  readonly gate = computed(() =>
    terrainGate(this.manifest(), this.mission.image()?.imageRef ?? null, this.readiness()),
  );

  initialize(): Promise<void> {
    return (this.loading ??= this.load());
  }

  /** Copies of verified grid/mask bytes for the routing worker (transferred, so copies). */
  packageBuffers(): { grid: ArrayBuffer; mask: ArrayBuffer } | null {
    if (this.gate() !== null || !this.buffers) return null;
    return { grid: this.buffers.grid.slice(0), mask: this.buffers.mask.slice(0) };
  }

  private url(path: string) {
    return new URL(path, this.document.baseURI).href;
  }

  private async load(): Promise<void> {
    this.statusState.set('loading');
    // The gate compares against the active image, so wait for it first.
    await this.mission.initialize();
    try {
      let index: unknown;
      try {
        index = await firstValueFrom(this.http.get<unknown>(this.url('data/terrain/index.json')));
      } catch (e) {
        if (e instanceof HttpErrorResponse && e.status === 404)
          return this.finish(null, 'unavailable', null);
        throw e;
      }
      if (!validTerrainIndex(index)) return this.fail('Terrain package index is invalid.');
      if (index.activePackageId === null) return this.finish(null, 'unavailable', null);

      const base = `data/terrain/${index.activePackageId}/`;
      const manifest = await firstValueFrom(
        this.http.get<unknown>(this.url(base + 'terrain-manifest.json')),
      );
      if (!validTerrainManifest(manifest) || manifest.packageId !== index.activePackageId)
        return this.fail('Terrain package manifest is invalid or does not match the index.');

      // Only fetch and verify bytes for a package that could pass the gate.
      if (
        manifest.admission.status !== 'accepted' ||
        manifest.imageRef !== this.mission.image()?.imageRef
      )
        return this.finish(manifest, 'unavailable', null);

      const bytes = new Map<string, Uint8Array>();
      const readiness = await terrainReadiness(manifest, async (path) => {
        try {
          const buf = await firstValueFrom(
            this.http.get(this.url(base + path), { responseType: 'arraybuffer' }),
          );
          const u8 = new Uint8Array(buf);
          bytes.set(path, u8);
          return u8;
        } catch {
          return null;
        }
      });
      const grid = bytes.get('grid.f32');
      const mask = bytes.get('mask.u8');
      this.buffers =
        readiness === 'verified' && grid && mask
          ? { grid: grid.slice().buffer, mask: mask.slice().buffer }
          : null;
      this.finish(
        manifest,
        readiness,
        readiness === 'verified'
          ? null
          : `Terrain package is ${readiness}. Terrain routing stays unavailable.`,
      );
    } catch {
      this.fail('Terrain package could not be loaded. Terrain routing stays unavailable.');
    }
  }

  private finish(
    manifest: TerrainManifest | null,
    readiness: TerrainReadiness,
    message: string | null,
  ) {
    this.manifestState.set(manifest);
    this.readinessState.set(readiness);
    this.messageState.set(message);
    this.statusState.set('ready');
  }
  private fail(message: string) {
    this.buffers = null;
    this.manifestState.set(null);
    this.readinessState.set('unavailable');
    this.messageState.set(message);
    this.statusState.set('error');
  }
}
