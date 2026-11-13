import type { APIRoute } from "astro";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";
import { getVisits } from "../../../lib/petflow-visits";

export const prerender = false;
const states = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));

export const GET: APIRoute = async ({ cookies }) => {
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return new Response("Não autenticado.", { status: 401 });
  try {
    const grouped = new Map<string, { day: string; country: string; region: string; count: number }>();
    for (const visit of await getVisits()) {
      const country = /^[A-Z]{2}$/.test(visit.country) ? visit.country : "XX";
      const region = country === "BR" && states.has(visit.region) ? visit.region : "";
      const key = `${visit.day}:${country}:${region}`;
      const row = grouped.get(key) || { day: visit.day, country, region, count: 0 };
      row.count++;
      grouped.set(key, row);
    }
    const lines = ["dia;país;estado;visitas", ...[...grouped.values()].sort((a, b) => a.day.localeCompare(b.day) || a.country.localeCompare(b.country) || a.region.localeCompare(b.region)).map(row => `${row.day};${row.country};${row.region};${row.count}`)];
    return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=petflow-visitas.csv", "Cache-Control": "no-store" } });
  } catch {
    return new Response("Histórico indisponível.", { status: 503 });
  }
};
