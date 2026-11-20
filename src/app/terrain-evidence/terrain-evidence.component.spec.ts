import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TerrainEvidenceComponent } from './terrain-evidence.component';
import type {
  TerrainContextSource,
  TerrainEvidenceState,
  TerrainProductMetadata,
  TerrainRoutingFailureCode,
} from './terrain-evidence.models';
import { UNAVAILABLE_TEXT } from './terrain-evidence.presenters';

/**
 * Synthetic test-only terrain fixtures. Never import or expose in production runtime assets.
 */
const SYNTHETIC_ACTIVE_IMAGE_REF = 'hirise-psp001752-red-center-2048-025m-v2';

function makeSyntheticMetadata(
  overrides: Partial<TerrainProductMetadata> = {},
): TerrainProductMetadata {
  return {
    packageId: 'synthetic-test-pkg-v1',
    productId: 'SYNTHETIC-TEST-DTM-001',
    productVersion: 'test-fixture-1.0',
    imageRef: SYNTHETIC_ACTIVE_IMAGE_REF,
    source: {
      title: 'Synthetic HiRISE Stereo DTM Fixture',
      url: 'https://www.uahirise.org/dtm/PSP_001488_1750',
      credit: 'Synthetic Test Fixture (NASA/JPL/University of Arizona format)',
      producer: 'HiRISE Science Operations Center (Test)',
      licenseOrTerms: 'Public domain scientific archive (synthetic test)',
    },
    acquisition: {
      sourceStereoImageIds: ['PSP_001488_1750', 'PSP_001752_1750'],
      acquisitionDates: ['2006-11-19', '2006-12-10'],
      processingHistory: 'Synthetic fixture stereo correlation -> 1.0 m grid resample',
    },
    horizontal: {
      crs: 'Equirectangular_Mars (R=3396190m)',
      units: 'meters',
      nativeSpacingMeters: 1.0,
      preparedSpacingMeters: 0.25,
      resamplingMethod: 'Bilinear (explicitly recorded test fixture)',
    },
    vertical: {
      units: 'meters',
      datumOrReference: 'Mars Areoid (synthetic fixture)',
      accuracyNote: 'Relative vertical precision ±0.35 m (synthetic)',
    },
    coverage: {
      summary: 'Covers 512 m x 512 m test crop bounds',
      overlapWithActiveImage: 'full',
      boundsSummary: 'pixels [0..2048, 0..2048]',
    },
    registration: {
      status: 'verified',
      method: 'Tie-point affine fit (synthetic)',
      residualSummary: 'RMS 0.42 px',
      toleranceSummary: '< 1.0 px',
      evidenceRef: 'docs/data/terrain-v2/ALIGNMENT_CHECK.md (synthetic)',
    },
    nodata: {
      nodataValue: '-3.4028235e+38',
      missingPercent: 1.25,
      policy: 'Blocked from experimental path solver; never interpolated silently',
    },
    uncertainty: {
      summary: 'Shadowed scarps increase stereo matching noise (synthetic)',
      verticalUncertaintyMeters: 0.5,
      horizontalUncertaintyMeters: 0.25,
      limitations: [
        'Does not resolve boulder/sand-trap hazards below native spacing.',
        'Never establishes EVA trafficability or crew safety.',
      ],
    },
    integrity: {
      sourceSha256: 'a'.repeat(64),
      preparedSha256: 'b'.repeat(64),
      byteLength: 4_194_304,
      offlinePackStatus: 'verified',
      claimedVerified: true,
    },
    ...overrides,
  };
}

function makeSyntheticEvidence(
  overrides: Partial<TerrainEvidenceState> = {},
): TerrainEvidenceState {
  return {
    contractVersion: 'v1-proposal',
    admission: {
      status: 'accepted',
      reviewer: 'Patrick (Coordinator)',
      decidedAtUtc: '2026-11-19T00:00:00Z',
      evidenceRef: 'docs/data/terrain-v2/ACCEPTANCE.md#synthetic-fixture',
      notes: 'Synthetic accepted test fixture.',
    },
    metadata: makeSyntheticMetadata(),
    ...overrides,
  };
}

describe('TerrainEvidenceComponent', () => {
  let fixture: ComponentFixture<TerrainEvidenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainEvidenceComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TerrainEvidenceComponent);
    fixture.componentRef.setInput('activeImageRef', SYNTHETIC_ACTIVE_IMAGE_REF);
    fixture.detectChanges();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  it('1. renders explicit empty/unavailable state when evidence is null or none', () => {
    expect(text()).toContain('No terrain package');
    expect(text()).toContain(UNAVAILABLE_TEXT);
    expect(text()).not.toContain('NaN');
  });

  it('2. distinguishes proposed, pending-review, rejected, and accepted admission states', () => {
    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        admission: { status: 'proposed', reviewer: null, decidedAtUtc: null, evidenceRef: null },
      }),
    );
    fixture.detectChanges();
    expect(text()).toContain('Proposed candidate (unreviewed)');

    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        admission: {
          status: 'pending-review',
          reviewer: null,
          decidedAtUtc: null,
          evidenceRef: null,
        },
      }),
    );
    fixture.detectChanges();
    expect(text()).toContain('Pending coordinator review');

    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        admission: {
          status: 'rejected',
          reviewer: 'Patrick',
          decidedAtUtc: '2026-11-19T01:00:00Z',
          evidenceRef: 'docs/data/terrain-v2/ACCEPTANCE.md#rej',
          rejectionReason: 'Offset exceeds 2.0 px tolerance',
        },
      }),
    );
    fixture.detectChanges();
    expect(text()).toContain('Rejected package (not usable)');
    expect(text()).toContain('Offset exceeds 2.0 px tolerance');

    fixture.componentRef.setInput('evidence', makeSyntheticEvidence());
    fixture.detectChanges();
    expect(text()).toContain('Accepted terrain package');
    expect(text()).toContain('Patrick (Coordinator)');
    expect(text()).toContain(
      'not a route safety, obstacle-clearance, or EVA trafficability certification',
    );
  });

  it('3a. anti-spoofing: hash, populated metadata, and claimedVerified never promote unreviewed state', () => {
    fixture.componentRef.setInput('evidence', {
      admission: null,
      metadata: makeSyntheticMetadata({
        integrity: {
          sourceSha256: 'deadbeef'.repeat(8),
          preparedSha256: 'cafebabe'.repeat(8),
          byteLength: 1024,
          offlinePackStatus: 'verified',
          claimedVerified: true,
        },
      }),
    });
    fixture.detectChanges();

    expect(text()).toContain('No terrain package');
    expect(text()).not.toContain('Accepted terrain package');
    expect(text()).toContain(
      'Supplied hashes, pack fields, or client-verified flags do not grant scientific acceptance',
    );
  });

  it('3b. anti-spoofing: downgrades accepted record missing coordinator reviewer, UTC timestamp, or evidenceRef', () => {
    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        admission: {
          status: 'accepted',
          reviewer: '   ',
          decidedAtUtc: null,
          evidenceRef: 'docs/data/terrain-v2/ACCEPTANCE.md',
        },
      }),
    );
    fixture.detectChanges();

    expect(text()).toContain('Pending review (incomplete admission record)');
    expect(text()).not.toContain('Accepted terrain package');
  });

  it('4. flags active imageRef mismatch and refuses alignment claim', () => {
    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        metadata: makeSyntheticMetadata({ imageRef: 'different-crop-v99' }),
      }),
    );
    fixture.detectChanges();

    expect(text()).toContain('Image mismatch (unaligned)');
    expect(text()).toContain('different-crop-v99');
    expect(text()).not.toContain('Accepted terrain package');
  });

  it('5. renders native vs prepared spacing, datum, registration, nodata, uncertainty, and missing NaN safety', () => {
    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        metadata: makeSyntheticMetadata({
          horizontal: {
            crs: 'Equirectangular_Mars',
            units: 'meters',
            nativeSpacingMeters: 1.0,
            preparedSpacingMeters: 0.25,
            resamplingMethod: null,
          },
          nodata: {
            nodataValue: null,
            missingPercent: Number.NaN,
            policy: null,
          },
        }),
      }),
    );
    fixture.detectChanges();

    const content = text();
    expect(content).toContain('Native: 1 m/pixel');
    expect(content).toContain('Prepared: 0.25 m/pixel');
    expect(content).toContain('Mars Areoid (synthetic fixture)');
    expect(content).toContain('RMS 0.42 px');
    expect(content).toContain('±0.5 m');
    expect(content).toContain(UNAVAILABLE_TEXT);
    expect(content).not.toContain('NaN');
  });

  it('6. renders safe https links only and neutralizes unsafe or credentialed URLs to plain text', () => {
    const el = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('evidence', makeSyntheticEvidence());
    fixture.detectChanges();
    const safeLink = el.querySelector('a.te-link') as HTMLAnchorElement | null;
    expect(safeLink).not.toBeNull();
    expect(safeLink?.href).toBe('https://www.uahirise.org/dtm/PSP_001488_1750');
    expect(safeLink?.rel).toContain('noopener');

    for (const badUrl of [
      'javascript:alert(1)',
      'http://insecure.example.com/dtm',
      'data:text/html,<script>alert(1)</script>',
      'https://user:pass@example.com/dtm',
    ]) {
      fixture.componentRef.setInput(
        'evidence',
        makeSyntheticEvidence({
          metadata: makeSyntheticMetadata({
            source: { title: 'Unsafe Source', url: badUrl, credit: 'Unknown' },
          }),
        }),
      );
      fixture.detectChanges();
      expect(el.querySelectorAll('a').length).toBe(0);
      expect(text()).toContain('Unlinked source text (requires valid HTTPS URL)');
    }
  });

  it.each<TerrainRoutingFailureCode>([
    'no-terrain-package',
    'terrain-not-accepted',
    'image-ref-mismatch',
    'offline-pack-incomplete',
    'invalid-endpoints',
    'endpoint-outside-coverage',
    'endpoint-on-nodata',
    'grade-limit-exceeded',
    'no-path-within-constraints',
    'cancelled',
    'stale-response',
    'worker-error',
    'unknown',
  ])('7. explains routing failure code "%s" without claiming terrain is impassable', (code) => {
    fixture.componentRef.setInput('routingOutcome', {
      status: 'unavailable',
      reasonCode: code,
      engineMessage: 'Diagnostic detail from worker',
      isProvisionalCode: true,
    });
    fixture.detectChanges();

    const content = text();
    expect(content).toContain(code);
    expect(content).toContain('Diagnostic detail from worker');
    expect(content).toMatch(
      /not\b.*\bimpassable|passability|never indicates impassable|nothing about terrain traversability/i,
    );
  });

  it('8. preserves non-terrain context sources and keeps geology, historical REMS, and Pixal3D separated', () => {
    const sources: TerrainContextSource[] = [
      {
        kind: 'regional-geology',
        title: 'USGS SIM 3292 Geologic Map of Mars (Htu)',
        credit: 'Tanaka et al., 2014 (USGS)',
        url: 'https://pubs.usgs.gov/sim/3292/',
        boundaryNote: '1:20,000,000 scale regional map (~5 km vertex spacing).',
        limitations: ['0 internal contacts inside the 512 m crop.'],
      },
      {
        kind: 'historical-rems',
        title: 'MSL REMS Sol 3900 / 4803 Excerpts',
        credit: 'NASA/JPL-Caltech/CAB',
        url: 'https://pds-atmospheres.nmsu.edu/',
        boundaryNote: 'Archived rover weather station data; not live route weather.',
      },
      {
        kind: 'illustrative-3d',
        title: 'Pixal3D AI Relief Mesh',
        credit: 'MARSWALK Offline Model',
        url: null,
        boundaryNote: 'Model-only geometry; uncalibrated.',
      },
    ];
    fixture.componentRef.setInput('contextSources', sources);
    fixture.detectChanges();

    const content = text();
    expect(content).toContain('USGS SIM 3292 Geologic Map of Mars (Htu)');
    expect(content).toContain('Tanaka et al., 2014 (USGS)');
    expect(content).toContain('MSL REMS Sol 3900 / 4803 Excerpts');
    expect(content).toContain('Archived rover weather station data; not live route weather.');
    expect(content).toContain('Pixal3D AI Relief Mesh');
    expect(content).toContain('not a measured DEM');
    expect(content).toContain('not a meter-scale obstacle or hazard map');
  });

  it('9. starts with collapsed details, toggles cleanly, handles long strings, and never touches localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    fixture.componentRef.setInput(
      'evidence',
      makeSyntheticEvidence({
        metadata: makeSyntheticMetadata({
          productId: 'LONG_' + 'X'.repeat(120),
          source: {
            title: 'Unbroken_' + 'A'.repeat(110),
            url: 'https://example.org/' + 'pathsegment'.repeat(12),
            credit: 'LongCredit_' + 'C'.repeat(90),
          },
        }),
      }),
    );
    fixture.detectChanges();

    const details = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('details'),
    ) as HTMLDetailsElement[];
    expect(details.length).toBe(3);
    expect(details.every((d) => !d.open)).toBe(true);

    details[0].open = true;
    fixture.detectChanges();
    expect(details[0].open).toBe(true);
    expect(text()).toContain('LONG_' + 'X'.repeat(120));

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(getItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});

describe('coordinator review fix E2-1', () => {
  it('an accepted package with no active image is not shown as aligned', async () => {
    const { resolveEffectiveAdmission } = await import('./terrain-evidence.presenters');
    const view = resolveEffectiveAdmission(
      {
        admission: { status: 'accepted', reviewer: 'P', decidedAtUtc: '2026-11-20T00:00:00Z', evidenceRef: 'x' },
        metadata: { packageId: 'p', productId: 'd', imageRef: 'img', source: null },
      },
      null,
    );
    expect(view.badgeLabel).toBe('No active image');
    expect(view.isAlignedToActiveImage).toBe(false);
  });
});
