import { useEffect, useMemo, useState } from "react";

type Shape = { code: string; name: string; path: string; cx: number; cy: number };
type Region = { country: string; region: string; sessions: number };

export default function PetFlowBrazilMap({ regions, total }: { regions: Region[]; total: number }) {
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  useEffect(() => { fetch("/assets/brand/brasil-states.json").then(response => response.json()).then(setShapes).catch(() => setShapes([])); }, []);
  const counts = useMemo(() => new Map(regions.filter(row => row.country === "BR").map(row => [row.region, row.sessions])), [regions]);
  if (!shapes) return <div className="petflow-map-stage" role="status">Carregando mapa…</div>;
  if (!shapes.length) return <div className="petflow-map-stage" role="status">Mapa indisponível no momento.</div>;
  const active = shapes.map(shape => ({ ...shape, sessions: counts.get(shape.code) || 0 })).filter(shape => shape.sessions > 0).sort((a, b) => b.sessions - a.sessions);
  const occupied: { x: number; y: number }[] = [];
  const positions = [[0, 0], [36, -32], [-36, -32], [36, 32], [-36, 32], [70, 0], [-70, 0], [0, -58], [0, 58], [90, -50], [-90, 50], [120, 30], [-120, -30]];
  return <div className="petflow-map-stage"><svg className="petflow-brazil-map" viewBox="0 0 650 580" role="img" aria-label={active.length ? `Visitas no Brasil: ${active.map(item => `${item.name}, ${item.sessions}`).join("; ")}` : "Mapa do Brasil sem visitas com estado identificado neste período"}>
    {shapes.map(shape => { const sessions = counts.get(shape.code) || 0; const percent = total ? Math.round(100 * sessions / total) : 0; return <path key={shape.code} d={shape.path} className="petflow-map-state" data-level={!sessions ? "none" : percent >= 25 ? "high" : percent >= 10 ? "medium" : "low"}><title>{`${shape.name} · ${sessions} visita${sessions === 1 ? "" : "s"} · ${percent}%`}</title></path>; })}
    {active.map(shape => { let x = shape.cx, y = shape.cy; for (const [dx, dy] of positions) { const xx = Math.max(32, Math.min(616, shape.cx + dx)); const yy = Math.max(22, Math.min(555, shape.cy + dy)); if (occupied.every(point => Math.abs(point.x - xx) > 60 || Math.abs(point.y - yy) > 38)) { x = xx; y = yy; break; } } occupied.push({ x, y }); const percent = total ? Math.round(100 * shape.sessions / total) : 0; return <g key={`badge-${shape.code}`}><title>{`${shape.name} · ${shape.sessions} visitas · ${percent}%`}</title>{Math.hypot(x - shape.cx, y - shape.cy) > 18 && <line className="petflow-map-leader" x1={shape.cx} y1={shape.cy} x2={x} y2={y} />}<g transform={`translate(${x} ${y})`} className="petflow-map-badge"><rect x="-29" y="-18" width="58" height="36" rx="8" /><text className="petflow-map-code" x="0" y="-3" textAnchor="middle">{shape.code}</text><text className="petflow-map-percent" x="0" y="12" textAnchor="middle">{percent}%</text></g></g>; })}
  </svg></div>;
}
