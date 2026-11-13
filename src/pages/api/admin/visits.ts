import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { analyticsSemanticModel } from "@wix/analytics-semantic-model";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";
import { getVisits, saoPauloDay } from "../../../lib/petflow-visits";

export const prerender = false;
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const states = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
const addDay = (day: string, count: number) => {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
};

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401, headers });
    const today = saoPauloDay();
    const yesterday = addDay(today, -1);
    const chosen = url.searchParams.get("days");
    const periodDays = chosen === "7" ? 7 : chosen === "30" ? 30 : "all";
    const start = periodDays === "all" ? "2026-11-11" : addDay(today, 1 - periodDays);
    const allRecords = await getVisits();
    const records = allRecords.filter(row => row.day >= start && row.day <= today);
    const byDay = new Map<string, number>();
    const byRegion = new Map<string, { country: string; region: string; sessions: number }>();
    for (const row of records) {
      const country = /^[A-Z]{2}$/.test(row.country) ? row.country : "XX";
      const region = country === "BR" && states.has(row.region) ? row.region : "";
      byDay.set(row.day, (byDay.get(row.day) || 0) + 1);
      const key = `${country}:${region}`;
      const group = byRegion.get(key) || { country, region, sessions: 0 };
      group.sessions += 1;
      byRegion.set(key, group);
    }
    const chartStart = periodDays === 7 ? addDay(today, -6) : periodDays === 30 ? addDay(today, -29) : "2026-11-11";
    const days: { date: string; sessions: number }[] = [];
    for (let day = chartStart; day <= today; day = addDay(day, 1)) days.push({ date: day, sessions: byDay.get(day) || 0 });
    const regions = [...byRegion.values()].sort((a, b) => b.sessions - a.sessions);
    const leadState = regions.find(row => row.country === "BR" && states.has(row.region))?.region || null;
    const historyByState = new Map<string, number>();
    for (const row of allRecords) {
      if (row.country === "BR" && states.has(row.region)) historyByState.set(row.region, (historyByState.get(row.region) || 0) + 1);
    }
    const historyStates = [...historyByState].map(([region, sessions]) => ({ region, sessions })).sort((a, b) => b.sessions - a.sessions || a.region.localeCompare(b.region));
    const firstDay = allRecords.reduce((earliest, row) => row.day < earliest ? row.day : earliest, today);
    let historicalWix: number | null = null;
    let historicalRegions: { country: string; region: string; sessions: number }[] = [];
    const wixStart = periodDays === "all" ? "2026-11-07" : start < "2026-11-07" ? "2026-11-07" : start;
    try {
      const query = auth.elevate(analyticsSemanticModel.querySemanticModelData);
      const result = await query("cad7fd34-2c8b-4dda-8296-3f9d47fb484d", {
        interval: { start: new Date(`${wixStart}T03:00:00.000Z`), end: new Date(`${addDay(today, 1)}T03:00:00.000Z`), timezone: "America/Sao_Paulo" },
        fields: ["traffic.country_code", "traffic.region", "traffic.sessions_count"],
        paging: { limit: 1000, offset: 0 },
        totalsIncluded: true
      });
      historicalWix = Number(result.totals?.fields?.["traffic.sessions_count"]?.numericValue ?? 0);
      historicalRegions = (result.results ?? []).map(row => ({
        country: row.fields?.["traffic.country_code"]?.stringValue || "XX",
        region: row.fields?.["traffic.region"]?.stringValue || "",
        sessions: Number(row.fields?.["traffic.sessions_count"]?.numericValue ?? 0)
      })).sort((a, b) => b.sessions - a.sessions);
    } catch { /* Live counter remains available even if Wix Analytics fails. */ }
    return new Response(JSON.stringify({ periodDays, periodStart: start, wixPeriodStart: wixStart, trackingSince: "11/11/2026", totalSessions: records.length, lifetimeSessions: allRecords.length, firstDay, historyStates, today: allRecords.filter(row => row.day === today).length, yesterday: allRecords.filter(row => row.day === yesterday).length, leadState, regions, days, historicalWix, historicalRegions }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "Visitas temporariamente indisponíveis." }), { status: 503, headers });
  }
};
