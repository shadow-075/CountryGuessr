import { useEffect, useMemo, useRef, useState } from 'react';
import { MAP_W } from '../lib/geo';
import { Icon } from './ui';

const MIN_W = 18;

/** Pan / pinch / wheel-zoom world map. Tap a country to call onPick(country). */
export default function WorldMap({ world, features, featureCountry, view0, onPick, wrongIds = [], revealId = null, className = '' }) {
  const svgRef = useRef(null);
  const [view, setView] = useState(view0);
  const pointers = useRef(new Map());
  const pinch = useRef(0);
  const moved = useRef(false);
  const startPt = useRef({ x: 0, y: 0 });
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const toSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const zoomAt = (factor, cx, cy) =>
    setView((v) => {
      const w = Math.min(MAP_W, Math.max(MIN_W, v.w * factor));
      const k = w / v.w;
      return { x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w, h: v.h * k };
    });

  const zoomCenter = (factor) => zoomAt(factor, view.x + view.w / 2, view.y + view.h / 2);

  // wheel needs a non-passive listener to prevent page scroll
  useEffect(() => {
    const svg = svgRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(e.deltaY > 0 ? 1.2 : 1 / 1.2, p.x, p.y);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    startPt.current = { x: e.clientX, y: e.clientY };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 1) {
      if (!moved.current && Math.hypot(cur.x - startPt.current.x, cur.y - startPt.current.y) > 6) {
        moved.current = true;
        svgRef.current.setPointerCapture(e.pointerId);
      }
      if (moved.current) {
        const scale = svgRef.current.getScreenCTM().a;
        setView((v) => ({ ...v, x: v.x - (cur.x - prev.x) / scale, y: v.y - (cur.y - prev.y) / scale }));
      }
    } else if (pointers.current.size === 2) {
      moved.current = true;
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      if (pinch.current && d) zoomAt(pinch.current / d, mid.x, mid.y);
      pinch.current = d;
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    pinch.current = 0;
  };

  const layer = useMemo(
    () =>
      features.map((f, i) => {
        const d = world.paths[i];
        if (!d) return null;
        const c = featureCountry.get(f);
        let fill = 'fill-ink-700';
        if (c) fill = 'fill-ink-600 hover:fill-ink-500 cursor-pointer';
        if (c && wrongIds.includes(c._id)) fill = 'fill-coral/70';
        if (c && c._id === revealId) fill = 'fill-lagoon';
        return (
          <path
            key={i}
            d={d}
            className={`${fill} stroke-ink-950 transition-colors`}
            strokeWidth="0.6"
            strokeLinejoin="round"
            style={{ vectorEffect: 'non-scaling-stroke' }}
            onClick={() => c && !moved.current && pickRef.current?.(c)}
          />
        );
      }),
    [features, world, featureCountry, wrongIds, revealId]
  );

  const btn = 'flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-ink-800/90 text-lg font-bold text-sand backdrop-blur transition hover:bg-ink-700 active:scale-95';

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0a1226] ring-1 ring-white/10 ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="World map"
      >
        {layer}
      </svg>
      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <button className={btn} onClick={() => zoomCenter(1 / 1.6)} aria-label="Zoom in">+</button>
        <button className={btn} onClick={() => zoomCenter(1.6)} aria-label="Zoom out">−</button>
        <button className={btn} onClick={() => setView(view0)} aria-label="Reset view"><Icon name="home" className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
