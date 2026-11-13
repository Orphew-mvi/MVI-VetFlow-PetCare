import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";
import { ADMIN_COOKIE, checkSession } from "../../lib/petflow-admin-auth";
import { recordVisit, saoPauloDay, VISIT_COOKIE, VISIT_WINDOW_MS } from "../../lib/petflow-visits";
import { lookupBrazilState } from "../../lib/petflow-geo";

export const prerender = false;
const encoder = new TextEncoder();
const botPattern = /bot|crawl|spider|preview|lighthouse|headless|monitor|uptime|wget|curl|python|facebookexternalhit|telegrambot|whatsapp/i;

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

async function signature(payload: string): Promise<string> {
  const getSecret = auth.elevate(secrets.getSecretValue);
  const key = (await getSecret("PETFLOW_ADMIN_SESSION_KEY")).value;
  if (!key) throw new Error("Visit signing key unavailable");
  const imported = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", imported, encoder.encode(`petflow-visit:${payload}`)));
}

async function recentVisit(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [stamp, nonce, mac, extra] = value.split(".");
  if (extra || !/^\d{13}$/.test(stamp || "") || !/^[0-9a-f-]{36}$/.test(nonce || "") || !/^[0-9a-f]{64}$/.test(mac || "")) return false;
  const elapsed = Date.now() - Number(stamp);
  if (elapsed < 0 || elapsed >= VISIT_WINDOW_MS) return false;
  return equal(mac, await signature(`${stamp}.${nonce}`));
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const origin = request.headers.get("origin");
  if (origin !== "https://www.mvipetcare.net" || request.headers.get("x-petflow-visit") !== "1") return new Response(null, { status: 403 });
  const agent = request.headers.get("user-agent") || "";
  if (!agent || botPattern.test(agent)) return new Response(null, { status: 204 });
  try {
    if (await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return new Response(null, { status: 204 });
    if (await recentVisit(cookies.get(VISIT_COOKIE)?.value)) return new Response(null, { status: 204 });
    const cf = (request as Request & { cf?: { country?: string; regionCode?: string } }).cf;
    const countryRaw = cf?.country || request.headers.get("cf-ipcountry") || "";
    let country = /^[A-Z]{2}$/.test(countryRaw) ? countryRaw : "XX";
    let region = "";
    // Match MVI Tech's IP-based regional lookup. Hosting country is the fallback.
    try {
      region = await lookupBrazilState(request.headers.get("cf-connecting-ip") || "");
      if (region) country = "BR";
    } catch { /* Keep counting when geolocation is unavailable. */ }
    if (!region && country === "BR") {
      const regionRaw = cf?.regionCode || "";
      region = /^[A-Z]{2}$/.test(regionRaw) ? regionRaw : "";
    }
    const payload = `${Date.now()}.${crypto.randomUUID()}`;
    const signedCookie = `${payload}.${await signature(payload)}`;
    await recordVisit({ day: saoPauloDay(), country, region });
    cookies.set(VISIT_COOKIE, signedCookie, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/visit", maxAge: VISIT_WINDOW_MS / 1000 });
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};
