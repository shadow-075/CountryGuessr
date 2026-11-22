import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoEqualEarth, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { normalize } from './utils';

/**
 * Country shapes come from the open "world.geo.json" dataset (Natural Earth based).
 * Tries a local copy first (drop `countries.geo.json` into /public for fully offline use),
 * then two CDNs.
 */
const SOURCES = [
  '/countries.geo.json',
  'https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json',
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
];

// d3 expects "spherical" winding (exterior rings clockwise). GeoJSON files often use the
// opposite, which makes d3 think a country is the whole planet minus the country. Fix per ring.
function fixRing(ring, exterior) {
  const isBig = geoArea({ type: 'Polygon', coordinates: [ring] }) > 2 * Math.PI;
  return isBig === exterior ? [...ring].reverse() : ring;
}
const fixPolygon = (poly) => poly.map((ring, i) => fixRing(ring, i === 0));

function rewind(feature) {
  const g = feature.geometry;
  if (g.type === 'Polygon') return { ...feature, geometry: { ...g, coordinates: fixPolygon(g.coordinates) } };
  if (g.type === 'MultiPolygon') return { ...feature, geometry: { ...g, coordinates: g.coordinates.map(fixPolygon) } };
  return feature;
}

export async function loadWorld() {
  let lastError;
  for (const url of SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.features?.length) {
        return data.features.filter((f) => f.geometry && f.id !== 'ATA').map(rewind);
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Could not load map data');
}

/** Match each API country to a map feature. Returns Map(countryId -> { feature, centroid }) */
export function buildGeoIndex(countries, features) {
  const byId = new Map(features.map((f) => [f.id, f]));
  const byName = new Map(features.map((f) => [normalize(f.properties?.name || ''), f]));
  const featureNames = [...byName.entries()];
  const out = new Map();

  for (const c of countries) {
    const name = normalize(c.name);
    let f = byId.get(c.alpha3Code) || byId.get(c.cioc) || byName.get(name);
    if (!f && name.length >= 5) {
      const hit = featureNames.find(([n]) => n.length >= 5 && (n.includes(name) || name.includes(n)));
      f = hit?.[1];
    }
    if (f) out.set(c._id, { feature: f, centroid: geoCentroid(f) });
  }
  return out;
}

/** SVG path for a single country, centred and scaled to fit a square box. */
export function outlinePath(feature, size = 320, pad = 18) {
  const [lon, lat] = geoCentroid(feature);
  const projection = geoAzimuthalEqualArea()
    .rotate([-lon, -lat])
    .precision(0.2)
    .fitExtent([[pad, pad], [size - pad, size - pad]], feature);
  return geoPath(projection)(feature);
}

/** Paths for a little globe turned to face the target country. */
export function globePaths(target, allFeatures, size = 240) {
  const [lon, lat] = geoCentroid(target);
  const projection = geoOrthographic()
    .rotate([-lon, -lat])
    .translate([size / 2, size / 2])
    .scale(size / 2 - 4)
    .clipAngle(90);
  const path = geoPath(projection);
  return {
    sphere: path({ type: 'Sphere' }),
    graticule: path(geoGraticule10()),
    land: allFeatures.map((f) => path(f)).filter(Boolean).join(' '),
    target: path(target),
  };
}

export { geoArea };

export const MAP_W = 1000;
export const MAP_H = 500;

/** Flat world map: one SVG path per feature (same order as `features`). */
export function worldMap(features) {
  const projection = geoEqualEarth().fitExtent([[2, 2], [MAP_W - 2, MAP_H - 2]], { type: 'Sphere' });
  const path = geoPath(projection);
  return { projection, paths: features.map((f) => path(f) || '') };
}

// [west, south, east, north]
const REGION_BOXES = {
  Africa: [-20, -36, 52, 38],
  Europe: [-25, 34, 45, 72],
  Asia: [25, -11, 150, 56],
  Americas: [-170, -56, -30, 72],
  Oceania: [110, -48, 180, 10],
};

/** Initial SVG viewBox framing the chosen regions (whole world if none). */
export function viewFor(regions, projection) {
  if (!regions.length) return { x: 0, y: 0, w: MAP_W, h: MAP_H };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of regions) {
    const [w, s, e, n] = REGION_BOXES[r];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const lon = w + (e - w) * t;
      const lat = s + (n - s) * t;
      for (const pt of [[lon, s], [lon, n], [w, lat], [e, lat]]) {
        const p = projection(pt);
        if (!p) continue;
        minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
      }
    }
  }
  const padX = (maxX - minX) * 0.05;
  const padY = (maxY - minY) * 0.05;
  return { x: minX - padX, y: minY - padY, w: maxX - minX + padX * 2, h: maxY - minY + padY * 2 };
}
