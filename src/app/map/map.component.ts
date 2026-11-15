import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as L from 'leaflet';
import { MissionService } from '../core/mission.service';
import { routePoints } from '../core/route';
import type { ImageManifest, Point, ScienceMarker } from '../core/models';

export interface DisplayRoutePoint {
  id: string;
  role: 'start' | 'waypoint' | 'destination';
  label: string;
  x: number;
  y: number;
  formattedCoordinates: string;
}

export interface RouteEndpointsStatus {
  complete: boolean;
  hasStart: boolean;
  hasDestination: boolean;
  statusText: string;
  missingText: string | null;
}

type ImageDisplayState = 'loading' | 'ready' | 'error';
const FOCUS_ROUTE_MAX_ZOOM = 2;
const VIEWPORT_PADDING: L.PointExpression = [32, 32];

/** Convert app image coordinates to Leaflet's [y, x] order at the map boundary. */
export function toLeafletPoint(point: Point): L.LatLngTuple {
  return [point.y, point.x];
}

/** Image bounds use Leaflet's [y, x] order: southwest, then northeast. */
export function imageBounds(
  image: Pick<ImageManifest, 'width' | 'height'>,
): L.LatLngBoundsExpression {
  return [
    [0, 0],
    [image.height, image.width],
  ];
}

function isDisplayable(
  marker: ScienceMarker,
  image: ImageManifest,
): marker is ScienceMarker & { position: Point } {
  const position = marker.position;
  return (
    marker.imageRef === image.imageRef &&
    !!position &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    position.x >= 0 &&
    position.x <= image.width &&
    position.y >= 0 &&
    position.y <= image.height
  );
}

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private mapContainer!: ElementRef<HTMLDivElement>;

  readonly mission = inject(MissionService);
  readonly imageDisplayState = signal<ImageDisplayState>('loading');
  readonly imageDisplayError = signal<string | null>(null);
  readonly canResetView = computed(
    () =>
      this.mission.dataStatus() === 'ready' &&
      this.mission.image() !== null &&
      this.imageDisplayState() === 'ready',
  );
  readonly canFocusRoute = computed(
    () => this.canResetView() && routePoints(this.mission.route()).length >= 2,
  );
  readonly canPlaceMapPoint = computed(
    () => this.canResetView() && this.mission.mode() !== 'inspect',
  );
  readonly mapPointActionLabel = computed(() => {
    const mode = this.mission.mode();
    if (mode === 'start') return 'Set start at map center';
    if (mode === 'destination') return 'Set destination at map center';
    return 'Add waypoint at map center';
  });
  readonly canRetryImage = computed(
    () =>
      this.mission.dataStatus() === 'ready' &&
      this.mission.image() !== null &&
      this.imageDisplayState() === 'error',
  );
  readonly showScienceMarkerEmptyState = computed(() => {
    const image = this.mission.image();
    if (
      this.mission.dataStatus() !== 'ready' ||
      !image ||
      this.imageDisplayState() !== 'ready' ||
      !this.mission.layers().markers
    ) {
      return false;
    }
    return !this.mission.markers().some((marker) => isDisplayable(marker, image));
  });

  readonly activeMode = computed(() => this.mission.mode());
  readonly activeModeLabel = computed(() => {
    switch (this.mission.mode()) {
      case 'inspect':
        return 'Inspect (pan/zoom)';
      case 'start':
        return 'Set Start';
      case 'waypoint':
        return 'Add Waypoint';
      case 'destination':
        return 'Set Destination';
    }
  });

  readonly routeEndpointsStatus = computed<RouteEndpointsStatus>(() => {
    const route = this.mission.route();
    const hasStart = route.start !== null;
    const hasDestination = route.destination !== null;
    const complete = hasStart && hasDestination;
    let statusText: string;
    if (!hasStart && !hasDestination) {
      statusText = 'Missing Start and Destination endpoints';
    } else if (!hasStart) {
      statusText = 'Missing Start endpoint';
    } else if (!hasDestination) {
      statusText = 'Missing Destination endpoint';
    } else {
      statusText = 'Required endpoints set (Start & Destination)';
    }
    return {
      complete,
      hasStart,
      hasDestination,
      statusText,
      missingText: complete ? null : statusText,
    };
  });

  readonly isScaleUnavailable = computed(() => {
    const image = this.mission.image();
    return !image?.calibration?.verified;
  });

  readonly scaleNotice = computed(() => {
    const image = this.mission.image();
    if (!image) return 'No image manifest loaded; scale is unavailable.';
    if (!image.calibration?.verified) {
      return 'Metric scale is unverified for this image; ground distances are unavailable. Coordinates are reported in bottom-left image pixels.';
    }
    return `Metric scale verified: ${image.calibration.metersPerPixel} m/px.`;
  });

  readonly existingRoutePoints = computed<DisplayRoutePoint[]>(() => {
    const route = this.mission.route();
    const points: DisplayRoutePoint[] = [];
    if (route.start) {
      points.push({
        id: 'start',
        role: 'start',
        label: 'Start',
        x: route.start.x,
        y: route.start.y,
        formattedCoordinates: `(${this.formatCoord(route.start.x)}, ${this.formatCoord(route.start.y)} px)`,
      });
    }
    route.waypoints.forEach((wp, index) => {
      points.push({
        id: `waypoint-${index}`,
        role: 'waypoint',
        label: `Waypoint ${index + 1}`,
        x: wp.x,
        y: wp.y,
        formattedCoordinates: `(${this.formatCoord(wp.x)}, ${this.formatCoord(wp.y)} px)`,
      });
    });
    if (route.destination) {
      points.push({
        id: 'destination',
        role: 'destination',
        label: 'Destination',
        x: route.destination.x,
        y: route.destination.y,
        formattedCoordinates: `(${this.formatCoord(route.destination.x)}, ${this.formatCoord(route.destination.y)} px)`,
      });
    }
    return points;
  });

  formatCoord(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  private readonly document = inject(DOCUMENT);
  private map?: L.Map;
  private imageOverlay?: L.ImageOverlay;
  private imageLoadHandler?: L.LeafletEventHandlerFn;
  private imageErrorHandler?: L.LeafletEventHandlerFn;
  private routeLayer?: L.LayerGroup;
  private markerLayer?: L.LayerGroup;
  private routeLine?: L.Polyline;
  private readonly routePoints = new Map<string, L.CircleMarker>();
  private readonly scienceMarkers = new Map<string, L.CircleMarker>();
  private resizeObserver?: ResizeObserver;
  private viewReady = false;
  private imageRequest = 0;
  private activeImageRef: string | null = null;
  private clickHandler?: (event: L.LeafletMouseEvent) => void;
  private readonly renderEffect = effect(() => {
    const status = this.mission.dataStatus();
    const image = this.mission.image();
    const route = this.mission.route();
    const markers = this.mission.markers();
    const layers = this.mission.layers();
    const selectedMarkerId = this.mission.selectedMarkerId();

    if (!this.viewReady) return;
    this.syncImage(status, image);
    if (!this.map || !image) return;
    this.syncRoute(route);
    this.syncMarkers(markers, image, selectedMarkerId);
    this.syncLayerVisibility(layers);
  });

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initializeMap();
    this.installResizeObserver();
    // Run once after the container exists; subsequent changes are handled by the effect.
    this.syncImage(this.mission.dataStatus(), this.mission.image());
  }

  ngOnDestroy(): void {
    this.imageRequest++;
    this.removeImageOverlay();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.map && this.clickHandler) this.map.off('click', this.clickHandler);
    this.clickHandler = undefined;
    this.renderEffect.destroy();
    this.map?.remove();
    this.map = undefined;
    this.imageOverlay = undefined;
    this.routeLayer = undefined;
    this.markerLayer = undefined;
    this.routeLine = undefined;
    this.routePoints.clear();
    this.scienceMarkers.clear();
  }

  get selectedMarker(): ScienceMarker | null {
    const image = this.mission.image();
    const selectedId = this.mission.selectedMarkerId();
    if (!image || !selectedId) return null;
    return (
      this.mission
        .markers()
        .find((marker) => marker.id === selectedId && marker.imageRef === image.imageRef) ?? null
    );
  }

  setLayerVisible(id: 'imagery' | 'markers', event: Event): void {
    this.mission.setLayer(id, (event.target as HTMLInputElement).checked);
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  placeRoutePointAtMapCenter(): void {
    const image = this.mission.image();
    if (!this.canPlaceMapPoint() || !this.map || !image) return;
    const center = this.map.getCenter();
    this.mission.applyMapPoint({
      x: Math.min(image.width, Math.max(0, center.lng)),
      y: Math.min(image.height, Math.max(0, center.lat)),
    });
  }

  resetView(): void {
    const image = this.mission.image();
    if (!this.canResetView() || !this.map || !image) return;
    this.map.fitBounds(imageBounds(image), { padding: VIEWPORT_PADDING });
  }

  focusRoute(): void {
    if (!this.canFocusRoute() || !this.map) return;
    const points = routePoints(this.mission.route());
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map(toLeafletPoint));
    this.map.fitBounds(bounds, {
      padding: VIEWPORT_PADDING,
      // A coincident route has zero-size bounds; cap zoom so focusing stays useful.
      maxZoom: FOCUS_ROUTE_MAX_ZOOM,
    });
  }

  retryImage(): void {
    const image = this.mission.image();
    if (!this.canRetryImage() || !this.map || !image) return;
    this.loadImageOverlay(image, false);
  }

  private initializeMap(): void {
    if (this.map || !this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      crs: L.CRS.Simple,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      minZoom: -4,
      maxZoom: 4,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      keyboard: true,
    });
    this.routeLayer = L.layerGroup().addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    this.routeLine = L.polyline([], {
      className: 'mw-route-line',
      color: '#ff8a4c',
      weight: 3.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.routeLayer);
    this.clickHandler = (event) => {
      if (this.mission.dataStatus() !== 'ready' || this.imageDisplayState() !== 'ready') return;
      this.mission.applyMapPoint({ x: event.latlng.lng, y: event.latlng.lat });
    };
    this.map.on('click', this.clickHandler);
  }

  private installResizeObserver(): void {
    const ResizeObserverType = this.document.defaultView?.ResizeObserver;
    if (!ResizeObserverType || !this.mapContainer?.nativeElement) return;
    this.resizeObserver = new ResizeObserverType(() => this.map?.invalidateSize({ pan: false }));
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  private syncImage(status: string, image: ImageManifest | null): void {
    if (status === 'loading') {
      this.imageDisplayState.set('loading');
      this.imageDisplayError.set(null);
      return;
    }
    if (status === 'unavailable' || status === 'error' || !image) {
      this.imageRequest++;
      this.activeImageRef = null;
      this.removeImageOverlay();
      this.clearRoutePointLayers();
      this.clearScienceMarkerLayers();
      this.imageDisplayState.set('error');
      this.imageDisplayError.set(null);
      return;
    }
    if (!this.map || this.activeImageRef === image.imageRef) return;

    this.loadImageOverlay(image, true);
  }

  private loadImageOverlay(image: ImageManifest, fitInitialView: boolean): void {
    const map = this.map;
    if (!map) return;

    // Invalidate previous overlay callbacks before removing or replacing a layer.
    const request = ++this.imageRequest;
    this.activeImageRef = image.imageRef;
    this.removeImageOverlay();
    this.imageDisplayState.set('loading');
    this.imageDisplayError.set(null);
    this.clearRoutePointLayers();
    this.clearScienceMarkerLayers();

    const assetUrl = new URL(image.assetPath, this.document.baseURI).href;
    if (fitInitialView) map.setView([image.height / 2, image.width / 2], -1);
    const overlay = L.imageOverlay(assetUrl, imageBounds(image), {
      interactive: false,
      className: 'mars-map-image',
      pane: 'tilePane',
    });
    this.imageOverlay = overlay;
    const onLoad: L.LeafletEventHandlerFn = async () => {
      this.detachImageHandlers(overlay, onLoad, onError);
      if (request !== this.imageRequest || this.activeImageRef !== image.imageRef) return;
      const element = overlay.getElement();
      if (!element) {
        this.failImage('The loaded image could not be decoded.');
        return;
      }

      try {
        await element.decode();
      } catch {
        if (request === this.imageRequest) {
          this.failImage('The loaded image could not be decoded.');
        }
        return;
      }

      if (request !== this.imageRequest || this.activeImageRef !== image.imageRef) return;
      if (element.naturalWidth !== image.width || element.naturalHeight !== image.height) {
        this.failImage('The loaded image dimensions do not match its manifest.');
        return;
      }
      this.imageDisplayState.set('ready');
      if (fitInitialView) map.fitBounds(imageBounds(image), { padding: [8, 8] });
      this.syncLayerVisibility(this.mission.layers());
      this.syncRoute(this.mission.route());
      this.syncMarkers(this.mission.markers(), image, this.mission.selectedMarkerId());
    };
    const onError: L.LeafletEventHandlerFn = () => {
      this.detachImageHandlers(overlay, onLoad, onError);
      if (request === this.imageRequest) this.failImage('The image file could not be loaded.');
    };
    this.imageLoadHandler = onLoad;
    this.imageErrorHandler = onError;
    overlay.on('load', onLoad).on('error', onError);
    overlay.addTo(map);
  }

  private failImage(message: string): void {
    this.removeImageOverlay();
    this.imageDisplayState.set('error');
    this.imageDisplayError.set(message);
    this.clearRoutePointLayers();
    this.clearScienceMarkerLayers();
  }

  private removeImageOverlay(): void {
    const overlay = this.imageOverlay;
    if (!overlay) return;
    this.detachImageHandlers(overlay, this.imageLoadHandler, this.imageErrorHandler);
    overlay.remove();
    this.imageOverlay = undefined;
  }

  private detachImageHandlers(
    overlay: L.ImageOverlay,
    loadHandler: L.LeafletEventHandlerFn | undefined,
    errorHandler: L.LeafletEventHandlerFn | undefined,
  ): void {
    if (loadHandler) overlay.off('load', loadHandler);
    if (errorHandler) overlay.off('error', errorHandler);
    if (this.imageOverlay === overlay) {
      this.imageLoadHandler = undefined;
      this.imageErrorHandler = undefined;
    }
  }

  private syncLayerVisibility(layers: Readonly<Record<string, boolean>>): void {
    if (!this.map) return;
    if (this.imageOverlay && this.imageDisplayState() === 'ready') {
      if (layers['imagery']) this.imageOverlay.addTo(this.map);
      else this.map.removeLayer(this.imageOverlay);
    }
    if (this.markerLayer) {
      if (layers['markers']) this.markerLayer.addTo(this.map);
      else this.map.removeLayer(this.markerLayer);
    }
    // Grid and coverage products are not supplied; their layers intentionally remain absent.
  }

  private syncRoute(route: ReturnType<MissionService['route']>): void {
    if (
      !this.routeLayer ||
      !this.routeLine ||
      !this.mission.image() ||
      this.imageDisplayState() !== 'ready'
    )
      return;
    const points: Point[] = [
      ...(route.start ? [route.start] : []),
      ...route.waypoints,
      ...(route.destination ? [route.destination] : []),
    ];
    this.routeLine.setLatLngs(points.map(toLeafletPoint));
    const desired = new Map<string, { point: Point; color: string; fill: string }>();
    if (route.start)
      desired.set('start', { point: route.start, color: '#69e4b1', fill: '#0d553d' });
    route.waypoints.forEach((point, index) =>
      desired.set(`waypoint-${index}`, {
        point,
        color: '#f4a340',
        fill: '#71430e',
      }),
    );
    if (route.destination)
      desired.set('destination', {
        point: route.destination,
        color: '#ff7e79',
        fill: '#762d35',
      });
    this.reconcilePointLayers(this.routePoints, desired, this.routeLayer);
  }

  private syncMarkers(
    markers: readonly ScienceMarker[],
    image: ImageManifest,
    selectedId: string | null,
  ): void {
    if (!this.markerLayer || this.imageDisplayState() !== 'ready') return;
    const desired = new Map<string, { point: Point; color: string; fill: string }>();
    for (const marker of markers) {
      if (!isDisplayable(marker, image)) continue;
      desired.set(
        marker.id,
        marker.positionStatus === 'illustrative'
          ? { point: marker.position, color: '#f4a340', fill: '#71430e' }
          : { point: marker.position, color: '#8ecbff', fill: '#16466c' },
      );
    }
    this.reconcilePointLayers(this.scienceMarkers, desired, this.markerLayer);
    for (const [id, layer] of this.scienceMarkers) {
      const marker = markers.find((item) => item.id === id);
      if (marker)
        layer.setStyle({
          color:
            id === selectedId
              ? '#ffffff'
              : marker.positionStatus === 'illustrative'
                ? '#f4a340'
                : '#8ecbff',
          weight: id === selectedId ? 4 : 2,
        });
    }
  }

  private reconcilePointLayers(
    existing: Map<string, L.CircleMarker>,
    desired: Map<string, { point: Point; color: string; fill: string }>,
    group: L.LayerGroup,
  ): void {
    for (const [key, layer] of existing) {
      if (!desired.has(key)) {
        group.removeLayer(layer);
        existing.delete(key);
      }
    }
    for (const [key, value] of desired) {
      const style = {
        className: 'mw-route-point',
        radius: 7,
        color: value.color,
        weight: 2,
        fillColor: value.fill,
        fillOpacity: 1,
        bubblingMouseEvents: false,
      };
      const current = existing.get(key);
      if (current) {
        current.setLatLng(toLeafletPoint(value.point));
        current.setStyle(style);
      } else {
        const layer = L.circleMarker(toLeafletPoint(value.point), style);
        if (existing === this.scienceMarkers) {
          layer.on('click', (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event.originalEvent);
            this.mission.selectMarker(key);
          });
        }
        existing.set(key, layer);
        group.addLayer(layer);
      }
    }
  }

  private clearRoutePointLayers(): void {
    this.routeLine?.setLatLngs([]);
    for (const layer of this.routePoints.values()) this.routeLayer?.removeLayer(layer);
    this.routePoints.clear();
  }

  private clearScienceMarkerLayers(): void {
    for (const layer of this.scienceMarkers.values()) this.markerLayer?.removeLayer(layer);
    this.scienceMarkers.clear();
  }
}
