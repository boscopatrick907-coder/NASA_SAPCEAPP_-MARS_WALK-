/**
 * The guided demo walk: a real route on the accepted terrain from the low ground in the
 * south-west of the study area up to the area with the strongest CRISM sulfate signal.
 * Coordinates are image pixels (bottom-left origin) of hirise-psp001752-red-ortho-2048-0253m-v3.
 */
import { MissionService } from '../../core/mission.service';
import { MissionBriefStore } from '../../core/mission-brief.store';
import { TerrainSamplerStore } from '../../core/terrain-sampler.store';
import type { Point } from '../../core/models';

export const DEMO_IMAGE_REF = 'hirise-psp001752-red-ortho-2048-0253m-v3';
export const DEMO_ROUTE: { start: Point; waypoint: Point; destination: Point } = {
  start: { x: 400, y: 1750 },
  waypoint: { x: 900, y: 1500 },
  destination: { x: 1450, y: 1250 },
};

/** Draws the demo route, loads the example assumptions and shows the sulfate layer. */
export function runDemoWalk(
  mission: MissionService,
  brief: MissionBriefStore,
  terrain: TerrainSamplerStore,
): boolean {
  const image = mission.image();
  if (!image || image.imageRef !== DEMO_IMAGE_REF) return false;
  mission.clearRoute();
  mission.setMode('start');
  mission.applyMapPoint(DEMO_ROUTE.start);
  mission.setMode('waypoint');
  mission.applyMapPoint(DEMO_ROUTE.waypoint);
  mission.setMode('destination');
  mission.applyMapPoint(DEMO_ROUTE.destination);
  mission.setMode('inspect');
  brief.useExample();
  terrain.showMineral.set(true);
  return true;
}
