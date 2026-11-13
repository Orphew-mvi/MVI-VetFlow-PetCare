import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { readSecret } from "../../../lib/petflow-telegram";
import { serviceByProductId } from "../../../lib/petflow-service-products";

export const prerender = false;
const origin = "https://www.mvipetcare.net";
const tokenName = "PETFLOW_MERCADOPAGO_ACCESS_TOKEN";
const enabledName = "PETFLOW_PAYMENTS_ENABLED";
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });

export const GET: APIRoute = async () => {
  const [token, enabled] = await Promise.all([readSecret(tokenName), readSecret(enabledName)]);
  return json({ ready: Boolean(token && enabled === "true") });
};

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("origin") !== origin) return json({ error: "Origem não permitida." }, 403);
  const [token, enabled] = await Promise.all([readSecret(tokenName), readSecret(enabledName)]);
  if (!token || enabled !== "true") return json({ error: "Pagamento em configuração." }, 503);

  const body = await request.json().catch(() => null) as { lines?: Array<{ productId?: unknown; quantity?: unknown }> } | null;
  const lines = body?.lines;
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 10 || lines.some(line => typeof line.productId !== "string" || !serviceByProductId[line.productId] || !Number.isInteger(line.quantity) || Number(line.quantity) < 1 || Number(line.quantity) > 10)) {
    return json({ error: "Carrinho inválido." }, 400);
  }
  const distinct = new Set(lines.map(line => line.productId));
  if (distinct.size !== lines.length) return json({ error: "Carrinho duplicado." }, 400);

  try {
    const catalog = await auth.elevate(items.query)("PetFlowServices", { paging: { limit: 100, offset: 0 }, fields: ["title", "price"] }, { consistentRead: true });
    const preferenceItems = lines.map(line => {
      const service = catalog.items?.find(row => row._id === serviceByProductId[String(line.productId)]);
      if (typeof service?.title !== "string" || typeof service?.price !== "number" || !Number.isFinite(service.price) || service.price <= 0) throw new Error("Serviço indisponível.");
      return { id: String(line.productId), title: service.title, quantity: Number(line.quantity), currency_id: "BRL", unit_price: service.price };
    });
    const preference = {
      items: preferenceItems,
      payment_methods: { excluded_payment_types: [{ id: "ticket" }] },
      external_reference: `PETFLOW-${crypto.randomUUID()}`,
      back_urls: {
        success: `${origin}/pagamento?resultado=sucesso`,
        pending: `${origin}/pagamento?resultado=pendente`,
        failure: `${origin}/pagamento?resultado=falha`,
      },
      auto_return: "approved",
    };
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(preference),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Mercado Pago ${response.status}`);
    const result = await response.json() as { init_point?: string };
    const url = new URL(result.init_point || "");
    if (url.protocol !== "https:" || (url.hostname !== "mercadopago.com.br" && !url.hostname.endsWith(".mercadopago.com.br"))) throw new Error("Endereço de pagamento inválido.");
    return json({ checkoutUrl: url.toString() });
  } catch (error) {
    console.error("PetFlow payment preference failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Não foi possível abrir o pagamento agora." }, 502);
  }
};
