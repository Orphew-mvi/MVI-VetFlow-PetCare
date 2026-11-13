import type { APIRoute } from "astro";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";
import { botCall, CHAT_NAME, readSecret, TOKEN_NAME } from "../../../lib/petflow-telegram";
import { getVisits, saoPauloDay } from "../../../lib/petflow-visits";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });

export const POST: APIRoute = async ({ cookies, request }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return json({ error: "Origem inválida." }, 403);
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return json({ error: "Não autenticado." }, 401);
  const [token, chatId] = await Promise.all([readSecret(TOKEN_NAME), readSecret(CHAT_NAME)]);
  if (!token || !chatId) return json({ error: "Conecte primeiro o bot VetFlow neste painel." }, 409);
  try {
    const now = new Date();
    const localDay = saoPauloDay(now);
    const visits = (await getVisits()).filter(row => row.day === localDay);
    const total = visits.length;
    const grouped = new Map<string, number>();
    for (const row of visits) if (row.country === "BR" && /^[A-Z]{2}$/.test(row.region)) grouped.set(row.region, (grouped.get(row.region) || 0) + 1);
    const states = [...grouped].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count);
    const known = states.reduce((sum, state) => sum + state.count, 0);
    const date = localDay.split("-").reverse().join("/");
    const hour = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(now);
    const stateReport = states.length ? states.map(state => `${state.code}: ${state.count} visita(s)`).join("\n") : "Nenhum estado brasileiro identificado.";
    const message = `🧪 TESTE — resumo de visitas do MVI VetFlow\n\nData: ${date}, parcial até ${hour} (São Paulo)\nContador próprio, ativo desde 11/11/2026: ${total} visita(s) hoje\n\nPor estado brasileiro:\n${stateReport}\nFora do Brasil ou sem estado identificado: ${total - known}\n\nUma nova visita é contada após 30 minutos. Acessos ao painel e robôs conhecidos não entram.\n\nPainel: https://www.mvipetcare.net/controle`;
    await botCall(token, "sendMessage", { chat_id: chatId, text: message, disable_web_page_preview: true });
    return json({ sent: true, date, total, stateCount: states.length });
  } catch {
    return json({ error: "Não foi possível enviar o resumo de teste. Confira a conexão do bot e tente novamente." }, 503);
  }
};
