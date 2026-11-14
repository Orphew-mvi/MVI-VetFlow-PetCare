import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { wixFetch } from "../../../wix/sdk";
import { readJsonObject } from "../../../lib/petflow-request";

export const prerender = false;
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const collectionId = "PetFlowServices";

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return new Response(JSON.stringify({ error: "Origem não permitida." }), { status: 403, headers });
  try {
    const serviceId = (await readJsonObject(request, 1024))?.serviceId;
    if (typeof serviceId !== "string" || !/^[0-9a-f-]{36}$/i.test(serviceId)) return new Response(JSON.stringify({ error: "Serviço inválido." }), { status: 400, headers });
    const query = auth.elevate(items.query);
    const catalog = await query(collectionId, { paging: { limit: 100, offset: 0 }, fields: ["title", "price"] }, { consistentRead: true });
    const service = catalog.items?.find(row => row._id === serviceId);
    const title = typeof service?.title === "string" ? service.title : "";
    const price = typeof service?.price === "number" ? service.price : NaN;
    if (!title || !Number.isFinite(price) || price <= 0) return new Response(JSON.stringify({ error: "Serviço indisponível no momento." }), { status: 404, headers });
    const result = await wixFetch("/ecom/v2/carts/current/add-line-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customItems: [{ name: { original: title }, quantityInfo: { requestedQuantity: 1 }, pricing: { price: { amount: price.toFixed(2) } }, attributes: { itemType: { preset: "SERVICE" } } }] })
    });
    if (!result.ok) return new Response(JSON.stringify({ error: "O carrinho não aceitou este serviço. Tente novamente em instantes." }), { status: 502, headers });
    const payload = await result.json();
    if (!payload.cart?.lineItems?.some((line: { name?: { original?: string }; status?: string }) => line.name?.original === title && line.status === "IN_STOCK")) return new Response(JSON.stringify({ error: "O serviço não apareceu no carrinho." }), { status: 502, headers });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Não foi possível adicionar o serviço agora." }), { status: 503, headers });
  }
};
