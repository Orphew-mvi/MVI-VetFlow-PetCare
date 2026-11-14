import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";

const TOKEN_NAME = "PETFLOW_TELEGRAM_BOT_TOKEN";
const CHAT_NAME = "PETFLOW_TELEGRAM_CHAT_ID";

export async function readSecret(name: string): Promise<string | null> {
  try { return (await auth.elevate(secrets.getSecretValue)(name)).value || null; }
  catch { return null; }
}

export async function saveSecret(name: string, value: string): Promise<void> {
  const list = await auth.elevate(secrets.listSecretInfo)();
  const existing = list.secrets?.find(item => item.name === name);
  if (existing?._id) await auth.elevate(secrets.updateSecret)(existing._id, { name, value });
  else await auth.elevate(secrets.createSecret)({ name, value });
}

export async function botCall<T>(token: string, method: string, body?: object): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json() as { ok: boolean; result: T };
  if (!response.ok || !result.ok) throw new Error(`Telegram ${method} failed`);
  return result.result;
}

export async function notifyNewLead(lead: { nome?: string; email?: string; telefone?: string; cidade?: string; servico?: string }): Promise<void> {
  const [token, chatId] = await Promise.all([readSecret(TOKEN_NAME), readSecret(CHAT_NAME)]);
  if (!token || !chatId) return;
  const safe = (value?: string) => String(value || "—").replace(/[<>]/g, "").slice(0, 180);
  await botCall(token, "sendMessage", { chat_id: chatId, text: `🐾 Novo pré-cadastro PetCare\nNome: ${safe(lead.nome)}\nContato: ${safe(lead.telefone)}\nE-mail: ${safe(lead.email)}\nCidade: ${safe(lead.cidade)}\nServiço: ${safe(lead.servico)}\n\nControle: https://www.mvipetcare.net/gestao-mvi`, disable_web_page_preview: true });
}

export { TOKEN_NAME, CHAT_NAME };
