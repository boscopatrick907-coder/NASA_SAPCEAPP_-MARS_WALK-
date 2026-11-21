/**
 * Coordinator container: connects runtime terrain state to Emma 1's planner controls and
 * Emma 2's evidence view. Holds no scientific logic of its own.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MissionService } from '../core/mission.service';
import { coverageLabel, imageCoverage, imageGeoref } from '../core/terrain';
import { TerrainService } from '../core/terrain.service';
import { TerrainEvidenceComponent } from '../terrain-evidence/terrain-evidence.component';
import type {
  TerrainEvidenceState,
  TerrainRoutingOutcome,
} from '../terrain-evidence/terrain-evidence.models';
import { TerrainPlannerComponent } from '../terrain-planner/terrain-planner.component';
import type {
  TerrainAvailabilityInput,
  TerrainEndpointsInput,
  TerrainPreviewAcceptPayload,
  TerrainRouteRequestPayload,
} from '../terrain-planner/terrain-planner.models';
import { TerrainPreviewService } from './terrain-preview.service';

type Loose = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

@Component({
  selector: 'app-terrain-preview',
  standalone: true,
  imports: [TerrainPlannerComponent, TerrainEvidenceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="terrain-preview" aria-labelledby="terrain-preview-title">
      <h2 id="terrain-preview-title">Terrain route preview (experimental)</h2>
      @if (terrain.status() === 'loading' || terrain.status() === 'idle') {
        <p role="status">Checking the terrain package…</p>
      }
      <app-terrain-planner
        [terrain]="availability()"
        [endpoints]="endpoints()"
        [preview]="preview.preview()"
        (requestPreview)="onRequest($event)"
        (cancelPreview)="preview.cancel()"
        (acceptPreview)="onAccept($event)"
        (rejectPreview)="preview.reject()"
      />
      @if (acceptMessage(); as msg) {
        <p role="status">{{ msg }}</p>
      }
      <app-terrain-evidence
        [evidence]="evidence()"
        [routingOutcome]="routingOutcome()"
        [activeImageRef]="mission.image()?.imageRef ?? null"
      />
    </section>
  `,
  styles: `
    .terrain-preview {
      display: grid;
      gap: var(--space-4, 16px);
      margin-top: var(--space-5, 24px);
    }
    h2 {
      font-size: 1.05rem;
      margin: 0;
    }
  `,
})
export class TerrainPreviewComponent implements OnInit {
  readonly mission = inject(MissionService);
  readonly terrain = inject(TerrainService);
  readonly preview = inject(TerrainPreviewService);
  readonly acceptMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.terrain.initialize();
  }

  readonly availability = computed<TerrainAvailabilityInput | null>(() => {
    const m = this.terrain.manifest();
    if (!m)
      return {
        status: 'none',
        packageId: null,
        imageRef: null,
        terrainResolutionMeters: null,
        statusNote: this.terrain.message(),
      };
    return {
      status: m.admission.status,
      packageId: m.packageId,
      imageRef: m.imageRef,
      terrainResolutionMeters: m.horizontal.preparedSpacingMeters,
      offlineReady: this.terrain.readiness() === 'verified',
      statusNote: this.terrain.message(),
    };
  });

  readonly endpoints = computed<TerrainEndpointsInput>(() => {
    const r = this.mission.route();
    return {
      start: r.start,
      destination: r.destination,
      activeImageRef: this.mission.image()?.imageRef ?? null,
      manualRoutePointCount: (r.start ? 1 : 0) + (r.destination ? 1 : 0) + r.waypoints.length,
    };
  });

  readonly routingOutcome = computed<TerrainRoutingOutcome>(() => {
    const gate = this.terrain.gate();
    return gate === null ? { status: 'available' } : { status: 'unavailable', reasonCode: gate };
  });

  readonly evidence = computed<TerrainEvidenceState | null>(() => {
    const m = this.terrain.manifest();
    if (!m) return null;
    const x = m as unknown as Loose;
    const sub = (k: string) => (x[k] && typeof x[k] === 'object' ? (x[k] as Loose) : {});
    const g = imageGeoref(this.mission.image());
    const grid = m.files.find((f) => f.path === 'grid.f32');
    const reg = sub('registration');
    const unc = sub('uncertainty');
    const acq = sub('acquisition');
    return {
      contractVersion: m.contractVersion,
      admission: { ...m.admission, notes: 'Accepted for experimental terrain preview only.' },
      metadata: {
        packageId: m.packageId,
        productId: m.productId,
        imageRef: m.imageRef,
        source: { title: m.source.title, url: m.source.url, credit: m.source.credit },
        acquisition: {
          sourceStereoImageIds: (acq['sourceStereoImageIds'] as string[] | undefined) ?? [],
          processingHistory: str(acq['processingHistory']),
        },
        horizontal: {
          crs: 'Equirectangular Mars sphere (same frame as the display image)',
          units: m.horizontal.units,
          nativeSpacingMeters: m.horizontal.nativeSpacingMeters,
          preparedSpacingMeters: m.horizontal.preparedSpacingMeters,
          resamplingMethod: str(sub('horizontal')['resamplingMethod']) ?? 'none',
        },
        vertical: {
          units: m.vertical.units,
          datumOrReference: m.vertical.datumOrReference,
          accuracyNote: str(sub('vertical')['accuracyNote']),
        },
        coverage: {
          overlapWithActiveImage: g
            ? coverageLabel(imageCoverage(g, m.grid.geotransform, m.grid.cols, m.grid.rows))
            : 'unverified',
          boundsSummary: `${m.grid.cols} × ${m.grid.rows} cells`,
        },
        registration: {
          status: (str(reg['status']) as 'provisional' | null) ?? 'unverified',
          method: str(reg['method']),
          residualSummary: str(reg['residualSummary']),
          toleranceSummary: str(reg['toleranceSummary']),
          evidenceRef: str(reg['evidenceRef']),
        },
        nodata: {
          missingPercent: num(sub('nodata')['missingPercent']),
          policy: 'No interpolation across missing cells.',
        },
        uncertainty: {
          verticalUncertaintyMeters: num(unc['verticalUncertaintyMeters']),
          horizontalUncertaintyMeters: num(unc['horizontalUncertaintyMeters']),
          limitations: (unc['limitations'] as string[] | undefined) ?? [],
        },
        integrity: {
          preparedSha256: grid?.sha256 ?? null,
          byteLength: m.files.reduce((n, f) => n + f.bytes, 0),
          offlinePackStatus:
            this.terrain.readiness() === 'verified'
              ? 'verified'
              : this.terrain.readiness() === 'corrupt'
                ? 'corrupt'
                : 'unavailable',
        },
      },
    };
  });

  onRequest(payload: TerrainRouteRequestPayload): void {
    this.acceptMessage.set(null);
    void this.preview.requestPreview(payload);
  }

  onAccept(payload: TerrainPreviewAcceptPayload): void {
    const r = this.preview.accept(payload);
    this.acceptMessage.set(
      r.ok
        ? 'Suggested route applied. Use Undo to restore your previous route, or Save Route to keep it.'
        : (r.error ?? 'The suggestion could not be applied.'),
    );
  }
}
