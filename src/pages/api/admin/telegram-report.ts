import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { submissions } from "@wix/forms";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";
import { botCall, CHAT_NAME, readSecret, TOKEN_NAME } from "../../../lib/petflow-telegram";
import { getVisits, saoPauloDay, type VisitRecord } from "../../../lib/petflow-visits";

export const prerender = false;
const FORM_ID = "b61d8f4f-b91a-4d58-966f-add9875ed345";
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
const states = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
const displayDate = (day: string) => day.split("-").reverse().join("/");
const previousDay = (day: string) => {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

function locationSummary(rows: VisitRecord[]): string {
  const byState = new Map<string, number>();
  const abroad = new Map<string, number>();
  let unknown = 0;
  for (const row of rows) {
    if (row.country === "BR" && states.has(row.region)) byState.set(row.region, (byState.get(row.region) || 0) + 1);
    else if (/^[A-Z]{2}$/.test(row.country) && row.country !== "XX" && row.country !== "BR") abroad.set(row.country, (abroad.get(row.country) || 0) + 1);
    else unknown++;
  }
  const ordered = (map: Map<string, number>) => [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const stateLine = ordered(byState).map(([code, count]) => `${code} ${count}`).join(" · ") || "nenhum";
  const abroadLine = ordered(abroad).map(([code, count]) => `${code} ${count}`).join(" · ") || "nenhum";
  return `🇧🇷 Estados: ${stateLine}\n🌎 Exterior: ${abroadLine}\n📍 Localização não identificada: ${unknown}`;
}

async function leadCounts(yesterday: string, today: string): Promise<{ yesterday: number; today: number }> {
  const query = auth.elevate(submissions.querySubmissionsByNamespace);
  let result = await query().eq("namespace", "wix.form_app.form").limit(100).find();
  let yesterdayCount = 0;
  let todayCount = 0;
  for (;;) {
    for (const item of result.items ?? []) {
      if (item.formId !== FORM_ID || !item._createdDate) continue;
      const day = saoPauloDay(new Date(item._createdDate));
      if (day === yesterday) yesterdayCount++;
      if (day === today) todayCount++;
    }
    if (!result.hasNext()) break;
    result = await result.next();
  }
  return { yesterday: yesterdayCount, today: todayCount };
}

export const POST: APIRoute = async ({ cookies, request }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return json({ error: "Origem inválida." }, 403);
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return json({ error: "Não autenticado." }, 401);
  const [token, chatId] = await Promise.all([readSecret(TOKEN_NAME), readSecret(CHAT_NAME)]);
  if (!token || !chatId) return json({ error: "Bot sem token ou conversa vinculada no Wix." }, 409);

  const now = new Date();
  const today = saoPauloDay(now);
  const yesterday = previousDay(today);
  let yesterdayVisits: VisitRecord[];
  let todayVisits: VisitRecord[];
  let leads: { yesterday: number; today: number };
  try {
    const [visits, counts] = await Promise.all([getVisits(), leadCounts(yesterday, today)]);
    yesterdayVisits = visits.filter(row => row.day === yesterday);
    todayVisits = visits.filter(row => row.day === today);
    leads = counts;
  } catch {
    return json({ error: "Não foi possível consultar as sessões ou os pré-cadastros no Wix. Nenhuma mensagem foi enviada." }, 503);
  }

  const hour = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(now);
  const message = [
    "🐾 <b>MVI VetFlow · Relatório PetCare</b>",
    "",
    `<b>Ontem · ${displayDate(yesterday)} (dia completo)</b>`,
    `👀 Sessões de visita: <b>${yesterdayVisits.length}</b>`,
    `📝 Pré-cadastros: <b>${leads.yesterday}</b>`,
    locationSummary(yesterdayVisits),
    "",
    `<b>Hoje · ${displayDate(today)} (até ${hour}, horário de Brasília)</b>`,
    `👀 Sessões de visita: <b>${todayVisits.length}</b>`,
    `📝 Pré-cadastros: <b>${leads.today}</b>`,
    locationSummary(todayVisits),
    "",
    "ℹ️ Uma sessão por navegador a cada 30 minutos; não são visitantes únicos. O contador começou em 11/11/2026 e pode incluir testes. Acessos ao painel e robôs conhecidos são excluídos."
  ].join("\n");
  try {
    await botCall(token, "sendMessage", { chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: true });
    return json({ sent: true, yesterday: { date: displayDate(yesterday), sessions: yesterdayVisits.length, leads: leads.yesterday }, today: { date: displayDate(today), hour, sessions: todayVisits.length, leads: leads.today } });
  } catch {
    return json({ error: "O Telegram não confirmou o envio. Confira a conexão do bot; nenhuma entrega foi confirmada." }, 502);
  }
};
