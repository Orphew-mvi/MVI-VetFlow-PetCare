import type { APIRoute } from "astro";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";
import { botCall, CHAT_NAME, readSecret, saveSecret, TOKEN_NAME } from "../../../lib/petflow-telegram";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
const validToken = (value: string) => /^\d{8,12}:[A-Za-z0-9_-]{30,60}$/.test(value);
const EXPECTED_BOT = "jarvis_telegram_mvi_bot";

export const GET: APIRoute = async ({ cookies }) => {
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return json({ error: "Não autenticado." }, 401);
  const [token, chatId] = await Promise.all([readSecret(TOKEN_NAME), readSecret(CHAT_NAME)]);
  if (!token) return json({ configured: false, connected: false });
  try {
    const me = await botCall<{ username: string }>(token, "getMe");
    return json({ configured: true, connected: Boolean(chatId), username: me.username });
  } catch { return json({ configured: true, connected: Boolean(chatId), error: "Bot indisponível. Confira o token." }); }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return json({ error: "Origem inválida." }, 403);
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return json({ error: "Não autenticado." }, 401);
  const body = await request.json().catch(() => null) as { action?: string; token?: string; code?: string } | null;
  if (!body) return json({ error: "Pedido inválido." }, 400);
  if (body.action === "save-token") {
    const token = String(body.token || "").trim();
    if (!validToken(token)) return json({ error: "Token inválido." }, 400);
    try {
      const bot = await botCall<{ username: string }>(token, "getMe");
      if (bot.username.toLowerCase() !== EXPECTED_BOT) return json({ error: `Este token pertence a @${bot.username}. Use o token do @${EXPECTED_BOT}.` }, 400);
      await saveSecret(TOKEN_NAME, token);
      return json({ configured: true, connected: false, username: bot.username });
    } catch { return json({ error: "Não foi possível validar ou guardar o bot." }, 502); }
  }
  const token = await readSecret(TOKEN_NAME);
  if (!token) return json({ error: "Configure primeiro o bot exclusivo do VetFlow." }, 400);
  if (body.action === "pair") {
    const code = `petflow_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const me = await botCall<{ username: string }>(token, "getMe");
    return json({ code, link: `https://t.me/${me.username}?start=${code}` });
  }
  if (body.action === "connect") {
    const code = String(body.code || "");
    if (!/^petflow_[0-9a-f]{20}$/.test(code)) return json({ error: "Código inválido." }, 400);
    try {
      const updates = await botCall<Array<{ message?: { text?: string; chat?: { id: number; type: string } } }>>(token, "getUpdates", { timeout: 0, limit: 100, allowed_updates: ["message"] });
      const match = updates.find(item => item.message?.chat?.type === "private" && item.message?.text?.trim() === `/start ${code}`);
      if (!match?.message?.chat?.id) return json({ error: "Ainda não encontrei o /start. Abra o bot pelo link e toque em Iniciar." }, 409);
      const chatId = String(match.message.chat.id);
      await saveSecret(CHAT_NAME, chatId);
      await botCall(token, "sendMessage", { chat_id: chatId, text: "🐾 Bot MVI VetFlow conectado. Novos pré-cadastros do PetCare aparecerão aqui." });
      return json({ configured: true, connected: true });
    } catch { return json({ error: "Não consegui conectar. Confira se este bot já usa outro serviço." }, 502); }
  }
  return json({ error: "Ação inválida." }, 400);
};
