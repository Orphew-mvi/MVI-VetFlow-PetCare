import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { checkout } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { readJsonObject } from "../../../lib/petflow-request";

export const prerender = false;
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const origin = "https://www.mvipetcare.net";

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("origin") !== origin) return new Response(JSON.stringify({ error: "Origem não permitida." }), { status: 403, headers });
  let stage = "validate";
  try {
    const body = await readJsonObject(request);
    const requested = Array.isArray(body?.items) ? body.items : [];
    if (!requested.length || requested.length > 20 || requested.some((entry: { id?: unknown; quantity?: unknown } | null) => !entry || typeof entry !== "object" || typeof entry.id !== "string" || !/^[0-9a-f-]{36}$/i.test(entry.id) || typeof entry.quantity !== "number" || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 10)) return new Response(JSON.stringify({ error: "Carrinho inválido." }), { status: 400, headers });
    stage = "catalog";
    const query = auth.elevate(items.query);
    const catalog = await query("PetFlowServices", { paging: { limit: 100, offset: 0 }, fields: ["title", "price"] }, { consistentRead: true });
    const customLineItems = requested.map((entry: { id: string; quantity: number }) => {
      const service = catalog.items?.find(row => row._id === entry.id);
      if (typeof service?.title !== "string" || typeof service?.price !== "number" || !Number.isFinite(service.price) || service.price <= 0) throw new Error("Serviço indisponível.");
      return { productName: { original: service.title }, quantity: entry.quantity, price: service.price.toFixed(2), itemType: { preset: "SERVICE" as const }, physicalProperties: { shippable: false } };
    });
    stage = "create-checkout";
    const createCheckout = auth.elevate(checkout.createCheckout);
    const createdCheckout = await createCheckout({ customLineItems, channelType: "WEB" });
    stage = "validate-checkout";
    if (!createdCheckout?._id || createdCheckout.lineItems?.length !== customLineItems.length) throw new Error("O Wix não aceitou todos os serviços.");
    stage = "redirect";
    const createRedirect = auth.elevate(redirects.createRedirectSession);
    const session = await createRedirect({ ecomCheckout: { checkoutId: createdCheckout._id }, callbacks: { postFlowUrl: `${origin}/atendimento`, thankYouPageUrl: `${origin}/atendimento` } });
    const checkoutUrl = session?.redirectSession?.fullUrl;
    if (!checkoutUrl) throw new Error("Checkout indisponível.");
    return new Response(JSON.stringify({ checkoutUrl }), { status: 200, headers });
  } catch {
    console.error("PetFlow checkout failed at stage", stage);
    return new Response(JSON.stringify({ error: "Não foi possível iniciar o pagamento. Tente novamente." }), { status: 503, headers });
  }
};
