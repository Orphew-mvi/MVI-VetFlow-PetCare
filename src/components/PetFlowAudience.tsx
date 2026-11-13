import { useCallback, useEffect, useState } from "react";
import PetFlowBrazilMap from "./PetFlowBrazilMap";

type Region = { country: string; region: string; sessions: number };
type Report = { periodDays: number | "all"; periodStart: string; wixPeriodStart: string; trackingSince: string; historicalWix: number | null; historicalRegions: Region[]; totalSessions: number; lifetimeSessions: number; firstDay: string; historyStates: { region: string; sessions: number }[]; today: number; yesterday: number; leadState: string | null; regions: Region[]; days: { date: string; sessions: number }[] };
const states: Record<string, string> = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const countryNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });

export default function PetFlowAudience({ onLifetimeChange }: { onLifetimeChange: (total: number) => void }) {
  const [period, setPeriod] = useState<7 | 30 | "all">("all");
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState("Carregando visitas…");
  const [mapSource, setMapSource] = useState<"wix" | "own">("wix");
  const load = useCallback(async () => {
    setStatus("Carregando visitas…");
    try {
      const response = await fetch(`/api/admin/visits?days=${period}`, { credentials: "same-origin", cache: "no-store" });
      const body = await response.json();
      if (!response.ok) { setReport(null); setStatus(body.error || "Visitas indisponíveis."); return; }
      setReport(body); onLifetimeChange(body.lifetimeSessions); setStatus("");
    } catch { setReport(null); setStatus("Não foi possível carregar as visitas."); }
  }, [period, onLifetimeChange]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => { void load(); }, 60_000); return () => window.clearInterval(timer); }, [load]);
  const showWix = mapSource === "wix" && !!report && report.historicalWix !== null;
  const mapRegions = showWix ? report?.historicalRegions || [] : report?.regions || [];
  const mapTotal = showWix ? report?.historicalWix || 0 : report?.totalSessions || 0;
  const ranked = mapRegions.filter(row => row.country === "BR" && states[row.region]).sort((a, b) => b.sessions - a.sessions);
  const foreignMap = new Map<string, number>();
  for (const row of mapRegions.filter(row => row.country !== "BR" && row.country !== "XX")) foreignMap.set(row.country, (foreignMap.get(row.country) || 0) + row.sessions);
  const foreign = [...foreignMap].map(([country, sessions]) => ({ country, sessions })).sort((a, b) => b.sessions - a.sessions);
  const ownStateTotal = (report?.regions || []).filter(row => row.country === "BR" && states[row.region]).reduce((sum, row) => sum + row.sessions, 0);
  const ownForeignTotal = (report?.regions || []).filter(row => row.country !== "BR" && row.country !== "XX").reduce((sum, row) => sum + row.sessions, 0);
  const unknownBrazil = (report?.regions || []).filter(row => row.country === "BR" && !states[row.region]).reduce((sum, row) => sum + row.sessions, 0);
  const unknownCountry = (report?.regions || []).filter(row => row.country === "XX").reduce((sum, row) => sum + row.sessions, 0);
  const mapLocated = mapRegions.reduce((sum, row) => sum + row.sessions, 0);
  const peak = Math.max(1, ...(report?.days || []).map(day => day.sessions));

  return <section id="audience" className="admin-card petflow-audience" aria-labelledby="audience-title">
    <div className="admin-section-head"><h2 id="audience-title">Visitantes do site</h2><div className="petflow-audience-tools"><label htmlFor="audience-days">Período</label><select id="audience-days" value={period} onChange={event => setPeriod(event.target.value === "all" ? "all" : Number(event.target.value) as 7 | 30)}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value="all">Desde o início</option></select><button type="button" onClick={() => void load()}>Atualizar</button></div></div>
    {status && <p className="admin-status" role="status">{status}</p>}
    {report && <>
      <p className="admin-footnote">Contador VetFlow ativo desde {report.trackingSince}. Atualização automática a cada minuto. Uma visita por navegador a cada 30 minutos; acessos ao painel e robôs conhecidos ficam fora.</p>
      <div className="petflow-audience-kpis"><div><span>Visitas hoje · contador próprio</span><strong>{report.today}</strong></div><div><span>Visitas ontem · contador próprio</span><strong>{report.yesterday}</strong></div><div><span>Visitas no período · contador próprio</span><strong>{report.totalSessions}</strong></div><div><span>Estado com mais visitas identificadas</span><strong className="petflow-leader">{report.leadState ? `${states[report.leadState]} · Brasil` : "—"}</strong></div></div>
      <div className="petflow-reconcile"><strong>Onde estão as {report.totalSessions} visitas do contador próprio?</strong><span>{ownStateTotal} com estado brasileiro identificado + {unknownBrazil} do Brasil sem estado + {ownForeignTotal} atribuídas a outros países + {unknownCountry} sem país. Todas permanecem no total.</span></div>
      <h3>Visitas por dia{period === "all" && <small className="petflow-chart-note"> · desde 11/11</small>}</h3><div className="petflow-visit-chart" role="img" aria-label={report.days.map(day => `${dayLabel(day.date)}: ${day.sessions} visitas`).join("; ")}>{report.days.map(day => <div key={day.date} className="petflow-visit-bar" title={`${dayLabel(day.date)} · ${day.sessions} visitas`}><span style={{ height: `${Math.max(3, day.sessions / peak * 100)}%` }} /></div>)}</div><div className="petflow-chart-axis"><span>{dayLabel(report.days[0].date)}</span><span>{dayLabel(report.days.at(-1)!.date)}</span></div>
      <div className="petflow-map-source"><div><h3>Distribuição geográfica</h3><p>{showWix ? `Wix Analytics · ${mapTotal} sessões de ${dayLabel(report.wixPeriodStart)} até hoje` : `Contador próprio · ${mapTotal} visitas no período`}. São medições diferentes; os totais não são somados. {mapLocated < mapTotal ? `${mapTotal - mapLocated} sessões sem localização na fonte selecionada.` : ""}</p></div><div className="petflow-source-buttons" role="group" aria-label="Fonte do mapa"><button type="button" className={showWix ? "active" : ""} disabled={report.historicalWix === null} onClick={() => setMapSource("wix")}>Histórico Wix</button><button type="button" className={!showWix ? "active" : ""} onClick={() => setMapSource("own")}>Contador próprio</button></div></div>
      <div className="petflow-audience-ranks"><div className="petflow-ranks-panel"><h3>Visitas por estado</h3><div className="petflow-state-list" tabIndex={0} aria-label="Lista de visitas por estado com rolagem">{ranked.length ? ranked.map(row => <div className="petflow-rank-line" key={row.region}><span>{states[row.region]} · Brasil</span><strong>{row.sessions} · {Math.round(row.sessions / Math.max(1, mapTotal) * 100)}%</strong><progress aria-label={`${states[row.region]} · ${row.sessions} visitas`} max={Math.max(1, mapTotal)} value={row.sessions} /></div>) : <p>Nenhum estado brasileiro identificado nesta fonte e período.</p>}</div></div><div className="petflow-map-panel"><h3>Mapa de visitas</h3><PetFlowBrazilMap regions={mapRegions} total={mapTotal} /><p className="petflow-map-caption">Percentual das visitas da fonte selecionada. Contornos dos estados: <a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html" target="_blank" rel="noopener noreferrer">IBGE</a>. Índice IP do contador próprio: <a href="https://db-ip.com/db/lite.php" target="_blank" rel="noopener noreferrer">DB-IP City Lite</a> (CC BY 4.0).</p></div></div>
      <section className="petflow-outside" aria-labelledby="foreign-title"><h3 id="foreign-title">Visitas de outros países · {showWix ? "Wix Analytics" : "contador próprio"}</h3><div className="admin-table-wrap"><table><caption className="visually-hidden">Países de origem das visitas fora do Brasil</caption><thead><tr><th scope="col">País</th><th scope="col">Visitas</th><th scope="col">% do período</th></tr></thead><tbody>{foreign.length ? foreign.map(row => <tr key={row.country}><td>{countryNames.of(row.country) || row.country}</td><td>{row.sessions}</td><td>{Math.round(row.sessions / Math.max(1, mapTotal) * 100)}%</td></tr>) : <tr><td colSpan={3}>Nenhuma visita de fora do Brasil neste período.</td></tr>}</tbody></table></div></section>
      <details className="petflow-state-history"><summary>Histórico por estado</summary><p>Desde {dayLabel(report.firstDay)} · {report.lifetimeSessions} visitas no total.</p>{report.historyStates.length ? <div className="petflow-state-list" tabIndex={0}>{report.historyStates.map(row => <div className="petflow-rank-line" key={row.region}><span>{states[row.region]} · Brasil</span><strong>{row.sessions} · {Math.round(row.sessions / Math.max(1, report.lifetimeSessions) * 100)}%</strong><progress max={Math.max(1, report.lifetimeSessions)} value={row.sessions} /></div>)}</div> : <p>Sem estados identificados até agora.</p>}<a href="/api/admin/visits.csv" download>Baixar histórico de visitas (.csv)</a></details>
      <p className="admin-footnote">Dias no horário de São Paulo. A localização é aproximada. O Wix Analytics mostra sessões desde 07/11 e pode ter atraso; o contador próprio começou em 11/11. O mesmo acesso pode aparecer nas duas fontes, por isso seus totais não são somados. Sessões antigas sem estado permanecem no contador próprio e não são atribuídas a uma UF sem evidência. A identidade de uma pessoa só é conhecida quando ela envia um cadastro.</p>
    </>}
  </section>;
}
