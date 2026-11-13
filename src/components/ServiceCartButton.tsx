import { useState } from "react";
import { useCart } from "../hooks/storefront/useCart";

const products: Record<string, { productId: string; variantId: string }> = {
  "bed78b15-acfe-46e3-a016-d0399d41e86b": { productId: "4be61856-8bfe-4733-af82-6080f033414d", variantId: "60feeefc-ea9a-41f2-bffe-b568d0c4a6c0" },
  "a2b3ae9c-2b39-4864-80e7-719f15339491": { productId: "75817cc0-6b40-45e5-bed8-92147ee08845", variantId: "27ecffd5-b2f9-48c0-87f7-e9e438bb691a" },
  "d90d6b2e-5488-4dd1-8a89-4886bd72442a": { productId: "983127cf-10cc-4cf9-9989-f3c0171afc11", variantId: "0f260d53-07ce-47c5-9496-4df672889145" },
  "7173e948-4d38-4b4c-b5dc-8ecf493feda4": { productId: "267aae1e-e9de-4813-b0de-d90e8b714132", variantId: "c74a5dbc-ed30-4261-94c4-647d98153a4b" },
  "482324b8-60e0-4947-9884-f3c86594b3fd": { productId: "10fdc1d6-5c06-4418-bcf2-bf6aac46ac2c", variantId: "0625c505-1424-4a88-9e11-e182cc0af760" },
  "ebbfb7d5-ac11-41c2-a1b5-5aaa824036e5": { productId: "2f3f0e00-b114-4d90-aa76-3f5201909611", variantId: "b43d3336-3a8a-4605-9930-9e6875485e68" },
  "b203b02e-a31c-406f-9689-a6401c62a128": { productId: "2f9f167c-78ef-4a1a-bc2f-e8f4e8f7ddd3", variantId: "c2da9c24-8693-40e6-98c5-fa4b57e664e6" },
  "b6278d60-025e-4e07-9e73-92b40142bfc1": { productId: "7ced2f24-173f-4725-a741-0cb92b0f044f", variantId: "79959ed9-487b-458d-83da-b8326e0a8a71" },
  "6cb91d1a-437e-4308-973f-66c30c599e55": { productId: "ce98a171-e3ab-419a-9c4e-1093557fc04c", variantId: "c714ab7d-9ce7-4c26-bc50-03c1faf92e89" },
  "50fa7dbf-2be7-4159-8865-1f37fb9d2bb9": { productId: "890db64e-17ed-41c5-9c0d-79fe0e030a7b", variantId: "cb7333ff-686d-4432-a6c9-c093ee7747ac" },
  "35d38f76-5b58-45a9-b1bf-a37d6a6d30d6": { productId: "1842cb42-4688-401a-b35e-b85de25bb201", variantId: "678c3ed8-e19e-4e90-b44a-52b41ba3b8dc" },
  "06746a08-15db-41af-9d1a-c0a60982a4c3": { productId: "36a1d06a-ab42-4d2d-83e1-0216f52376de", variantId: "f6a9af29-01b6-40c4-afc3-88f5acaa530a" },
};

export default function ServiceCartButton({ serviceId }: { serviceId: string; title: string; price: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const offer = products[serviceId];
  if (!offer) return null;
  async function add() {
    setBusy(true); setError("");
    try { await addToCart(offer.productId, offer.variantId, 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível adicionar agora."); }
    finally { setBusy(false); }
  }
  return <div className="service-cart-control"><button type="button" disabled={busy} onClick={() => void add()}>{busy ? "Adicionando…" : "Adicionar ao carrinho"}</button>{error && <p role="alert">{error}</p>}</div>;
}
