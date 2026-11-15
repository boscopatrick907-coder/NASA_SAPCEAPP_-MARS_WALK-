import { Component, computed, effect, inject, signal } from '@angular/core';
import { MissionService } from '../core/mission.service';
import type { ScienceMarker } from '../core/models';

export type EvidenceFilter = 'all' | ScienceMarker['evidenceType'];
export type PositionFilter = 'all' | 'located' | 'verified' | 'illustrative' | 'unavailable';

const EVIDENCE_FILTER_OPTIONS: readonly EvidenceFilter[] = [
  'all',
  'measured',
  'derived',
  'interpreted',
  'simulated',
];

const POSITION_FILTER_OPTIONS: readonly PositionFilter[] = [
  'all',
  'located',
  'verified',
  'illustrative',
  'unavailable',
];

let nextInstanceId = 0;

@Component({
  selector: 'app-science-context',
  standalone: true,
  templateUrl: './science-context.component.html',
  styleUrl: './science-context.component.scss',
})
export class ScienceContextComponent {
  readonly mission = inject(MissionService);
  protected readonly instanceId = ++nextInstanceId;

  readonly searchQuery = signal('');
  readonly evidenceFilter = signal<EvidenceFilter>('all');
  readonly positionFilter = signal<PositionFilter>('all');
  readonly isCompareMode = signal(false);
  readonly comparisonIds = signal<readonly string[]>([]);
  readonly comparisonAnnouncement = signal('');

  private readonly pruneRemovedComparisons = effect(() => {
    if (this.mission.dataStatus() !== 'ready') {
      return;
    }

    const comparedIds = this.comparisonIds();
    const availableIds = new Set(this.mission.markers().map((record) => record.id));
    const removedIds = comparedIds.filter((id) => !availableIds.has(id));
    if (removedIds.length === 0) {
      return;
    }

    this.comparisonIds.set(comparedIds.filter((id) => availableIds.has(id)));
    this.comparisonAnnouncement.set(
      removedIds.length === 1
        ? 'A compared science record was removed because it is no longer present in the loaded source.'
        : `${removedIds.length} compared science records were removed because they are no longer present in the loaded source.`,
    );
  });

  readonly comparedRecords = computed<readonly ScienceMarker[]>(() => {
    const recordsById = new Map(this.mission.markers().map((record) => [record.id, record]));
    return this.comparisonIds().flatMap((id) => {
      const record = recordsById.get(id);
      return record ? [record] : [];
    });
  });

  readonly comparisonIsFull = computed(() => this.comparisonIds().length >= 2);

  readonly selectedRecord = computed<ScienceMarker | null>(
    () => this.mission.markers().find((m) => m.id === this.mission.selectedMarkerId()) ?? null,
  );

  readonly recordBadge = computed(() => {
    const records = this.mission.markers();
    const located = records.filter(
      (record) => record.position !== null && record.positionStatus !== 'unavailable',
    ).length;
    return `${records.length} records (${located} located on image)`;
  });

  readonly positionBreakdown = computed(() => {
    const records = this.mission.markers();
    let located = 0;
    let verified = 0;
    let illustrative = 0;
    for (const record of records) {
      if (record.position === null || record.positionStatus === 'unavailable') {
        continue;
      }
      if (record.positionStatus === 'verified') {
        located += 1;
        verified += 1;
      } else if (record.positionStatus === 'illustrative') {
        located += 1;
        illustrative += 1;
      }
    }
    return { located, verified, illustrative };
  });

  readonly filteredMarkers = computed<readonly ScienceMarker[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const evidence = this.evidenceFilter();
    const position = this.positionFilter();

    return this.mission.markers().filter((record) => {
      if (evidence !== 'all' && record.evidenceType !== evidence) {
        return false;
      }
      if (!this.matchesPositionFilter(record, position)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [record.name, record.finding, record.instrument ?? '', record.source.title].some(
        (field) => field.toLowerCase().includes(query),
      );
    });
  });

  readonly selectedFilteredIndex = computed(() => {
    const selectedId = this.mission.selectedMarkerId();
    if (selectedId === null) {
      return -1;
    }
    return this.filteredMarkers().findIndex((record) => record.id === selectedId);
  });

  readonly navigationPosition = computed(() => {
    const index = this.selectedFilteredIndex();
    if (index < 0) {
      return 'Selected record is outside the current filter results.';
    }
    return `Record ${index + 1} of ${this.filteredMarkers().length} matching records`;
  });

  readonly canNavigatePrevious = computed(() => this.selectedFilteredIndex() > 0);

  readonly canNavigateNext = computed(() => {
    const index = this.selectedFilteredIndex();
    return index >= 0 && index < this.filteredMarkers().length - 1;
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.evidenceFilter() !== 'all' ||
      this.positionFilter() !== 'all',
  );

  readonly isSelectedHiddenByFilter = computed(() => {
    const selected = this.selectedRecord();
    if (!selected) {
      return false;
    }
    return !this.filteredMarkers().some((record) => record.id === selected.id);
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  onEvidenceFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value as EvidenceFilter | undefined;
    if (value && EVIDENCE_FILTER_OPTIONS.includes(value)) {
      this.evidenceFilter.set(value);
    }
  }

  onPositionFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value as PositionFilter | undefined;
    if (value && POSITION_FILTER_OPTIONS.includes(value)) {
      this.positionFilter.set(value);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.evidenceFilter.set('all');
    this.positionFilter.set('all');
  }

  selectRecord(id: string): void {
    this.mission.selectMarker(id);
  }

  clearSelection(): void {
    this.mission.selectMarker(null);
  }

  toggleCompareMode(): void {
    this.isCompareMode.update((enabled) => !enabled);
  }

  isCompared(id: string): boolean {
    return this.comparisonIds().includes(id);
  }

  isComparisonRecordHidden(record: ScienceMarker): boolean {
    return !this.filteredMarkers().some((visibleRecord) => visibleRecord.id === record.id);
  }

  addToComparison(id: string): void {
    if (this.mission.dataStatus() !== 'ready') {
      return;
    }

    const record = this.mission.markers().find((candidate) => candidate.id === id);
    if (!record) {
      this.comparisonAnnouncement.set('That science record is no longer available to compare.');
      return;
    }

    const currentIds = this.comparisonIds();
    if (currentIds.includes(id)) {
      this.comparisonAnnouncement.set(`${record.name} is already in the evidence comparison.`);
      return;
    }
    if (currentIds.length >= 2) {
      this.comparisonAnnouncement.set(
        'The evidence comparison already has two records. Remove one before adding another.',
      );
      return;
    }

    this.comparisonIds.set([...currentIds, id]);
    this.comparisonAnnouncement.set(
      `Added ${record.name} to evidence comparison. ${currentIds.length + 1} of 2 records selected.`,
    );
  }

  removeFromComparison(id: string): void {
    const currentIds = this.comparisonIds();
    if (!currentIds.includes(id)) {
      return;
    }

    const name =
      this.mission.markers().find((record) => record.id === id)?.name ?? 'Science record';
    this.comparisonIds.set(currentIds.filter((comparedId) => comparedId !== id));
    this.comparisonAnnouncement.set(`Removed ${name} from evidence comparison.`);
  }

  clearComparison(): void {
    if (this.comparisonIds().length === 0) {
      return;
    }
    this.comparisonIds.set([]);
    this.comparisonAnnouncement.set('Evidence comparison cleared.');
  }

  navigateToPreviousRecord(): void {
    this.selectAdjacentRecord(-1);
  }

  navigateToNextRecord(): void {
    this.selectAdjacentRecord(1);
  }

  isSelected(id: string): boolean {
    return this.mission.selectedMarkerId() === id;
  }

  formatPositionBadge(record: ScienceMarker): string {
    if (record.positionStatus === 'unavailable' || record.position === null) {
      return 'Regional context';
    }
    if (record.positionStatus === 'illustrative') {
      return 'Illustrative image point';
    }
    if (record.positionStatus === 'verified') {
      return 'Verified image point';
    }
    return 'Position status unavailable';
  }

  private selectAdjacentRecord(offset: -1 | 1): void {
    const currentIndex = this.selectedFilteredIndex();
    const adjacentRecord = this.filteredMarkers()[currentIndex + offset];
    if (currentIndex < 0 || !adjacentRecord) {
      return;
    }
    this.mission.selectMarker(adjacentRecord.id);
  }

  formatPositionStatus(record: ScienceMarker): string {
    if (record.positionStatus === 'unavailable' || record.position === null) {
      return 'Unavailable on this image — regional context only, with no point to use as a route stop. Choose a route point on the map separately.';
    }
    if (record.positionStatus === 'illustrative' && record.position) {
      return `Illustrative image position (${record.position.x}, ${record.position.y} px; bottom-left origin); not a verified location. Selecting this record does not set a route point.`;
    }
    if (record.positionStatus === 'verified' && record.position) {
      return `Verified image position (${record.position.x}, ${record.position.y} px; bottom-left origin). Selecting this record highlights its map point but does not set a route point.`;
    }
    return 'Unavailable on this image — position status is missing or unsupported; do not use as a route stop.';
  }

  safeExternalUrl(url: string): string | null {
    if (typeof url !== 'string') return null;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? url : null;
    } catch {
      return null;
    }
  }

  private matchesPositionFilter(record: ScienceMarker, filter: PositionFilter): boolean {
    if (filter === 'all') {
      return true;
    }
    const hasCoords = record.position !== null;
    if (filter === 'unavailable') {
      return !hasCoords || record.positionStatus === 'unavailable';
    }
    if (!hasCoords) {
      return false;
    }
    if (filter === 'located') {
      return record.positionStatus === 'verified' || record.positionStatus === 'illustrative';
    }
    return record.positionStatus === filter;
  }
}
