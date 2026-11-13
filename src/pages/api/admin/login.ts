import type { APIRoute } from "astro";
import { ADMIN_COOKIE, checkPassword, createSession, sessionCookieOptions } from "../../../lib/petflow-admin-auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return new Response(null, { status: 403 });
  let body: { username?: string; password?: string };
  try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }
  try {
    if (!await checkPassword(body.username ?? "", body.password ?? "")) return new Response(JSON.stringify({ error: "Credenciais inválidas." }), { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    cookies.set(ADMIN_COOKIE, await createSession(), sessionCookieOptions);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return new Response(JSON.stringify({ error: "Acesso temporariamente indisponível." }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
};
