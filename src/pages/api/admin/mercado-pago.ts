import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";
import { readSecret, saveSecret } from "../../../lib/petflow-telegram";

export const prerender = false;
const tokenName = "PETFLOW_MERCADOPAGO_ACCESS_TOKEN";
const enabledName = "PETFLOW_PAYMENTS_ENABLED";
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });

export const GET: APIRoute = async ({ cookies }) => {
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return json({ error: "Não autenticado." }, 401);
  const [token, enabled] = await Promise.all([readSecret(tokenName), readSecret(enabledName)]);
  return json({ configured: Boolean(token), active: Boolean(token && enabled === "true") });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return json({ error: "Origem inválida." }, 403);
  if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return json({ error: "Não autenticado." }, 401);
  const body = await request.json().catch(() => null) as { action?: string; token?: string } | null;
  if (body?.action === "save") {
    const token = String(body.token || "").trim();
    if (!/^APP_USR-[A-Za-z0-9-]{40,200}$/.test(token)) return json({ error: "Use o Access Token de produção do Mercado Pago." }, 400);
    await saveSecret(enabledName, "false");
    await saveSecret(tokenName, token);
    return json({ configured: true, active: false });
  }
  if (body?.action === "activate") {
    const token = await readSecret(tokenName);
    if (!token) return json({ error: "Guarde primeiro o Access Token de produção." }, 400);
    try {
      const catalog = await auth.elevate(items.query)("PetFlowServices", { paging: { limit: 100, offset: 0 }, fields: ["title", "price"] }, { consistentRead: true });
      const service = catalog.items?.find(row => row._id === "7173e948-4d38-4b4c-b5dc-8ecf493feda4");
      if (typeof service?.title !== "string" || typeof service?.price !== "number" || service.price <= 0) throw new Error("Catálogo indisponível.");
      const preference = {
        items: [{ id: "267aae1e-e9de-4813-b0de-d90e8b714132", title: service.title, quantity: 1, currency_id: "BRL", unit_price: service.price }],
        payment_methods: { excluded_payment_types: [{ id: "ticket" }] },
        external_reference: `PETFLOW-CONFIG-${crypto.randomUUID()}`,
        back_urls: {
          success: "https://www.mvipetcare.net/pagamento?resultado=sucesso",
          pending: "https://www.mvipetcare.net/pagamento?resultado=pendente",
          failure: "https://www.mvipetcare.net/pagamento?resultado=falha",
        },
      };
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(preference),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Mercado Pago ${response.status}`);
      const result = await response.json() as { init_point?: string; payment_methods?: { excluded_payment_types?: Array<{ id?: string }> } };
      const checkoutUrl = new URL(result.init_point || "");
      const ticketExcluded = result.payment_methods?.excluded_payment_types?.some(type => type.id === "ticket");
      if (checkoutUrl.protocol !== "https:" || !checkoutUrl.hostname.endsWith(".mercadopago.com.br") || !ticketExcluded) throw new Error("O Mercado Pago não confirmou a exclusão do boleto.");
      await saveSecret(enabledName, "true");
      return json({ configured: true, active: true });
    } catch (error) {
      await saveSecret(enabledName, "false");
      return json({ error: error instanceof Error ? error.message : "Falha na validação." }, 502);
    }
  }
  return json({ error: "Ação inválida." }, 400);
};
