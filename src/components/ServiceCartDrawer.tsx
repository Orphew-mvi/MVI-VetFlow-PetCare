import { useEffect, useState } from "react";
import { onOpenServiceCart, readServiceCart, setServiceQuantity, subscribeServiceCart, type ServiceLine } from "../lib/petflow-service-cart";

const PAYMENT_READY = false; // Enable only after payment method and hosted checkout are verified.
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ServiceCartDrawer() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ServiceLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const refresh = () => setLines(readServiceCart()); refresh(); return subscribeServiceCart(refresh); }, []);
  useEffect(() => onOpenServiceCart(() => setOpen(true)), []);
  useEffect(() => { if (!open) return; const before = document.body.style.overflow; document.body.style.overflow = "hidden"; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.addEventListener("keydown", close); return () => { document.body.style.overflow = before; document.removeEventListener("keydown", close); }; }, [open]);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  async function checkout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/cart/checkout-services", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: lines.map(line => ({ id: line.id, quantity: line.quantity })) }) });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Pagamento indisponível.");
      window.location.assign(result.checkoutUrl);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Pagamento indisponível."); setBusy(false); }
  }
  if (!open) return null;
  return <div className="petflow-cart-overlay" onClick={() => setOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Carrinho de serviços PetCare" className="petflow-cart-drawer" onClick={event => event.stopPropagation()}><header><h2>Carrinho PetCare</h2><button type="button" aria-label="Fechar carrinho" onClick={() => setOpen(false)}>×</button></header><div className="petflow-cart-lines">{lines.length ? lines.map(line => <article key={line.id}><div><strong>{line.title}</strong><small>{money(line.price)} por atendimento</small><div className="petflow-cart-quantity"><button type="button" aria-label={`Diminuir ${line.title}`} onClick={() => setServiceQuantity(line.id, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" aria-label={`Aumentar ${line.title}`} disabled={line.quantity >= 10} onClick={() => setServiceQuantity(line.id, line.quantity + 1)}>+</button></div></div><b>{money(line.price * line.quantity)}</b></article>) : <p>Seu carrinho está vazio.</p>}</div>{lines.length > 0 && <footer><div className="petflow-cart-total"><span>Total</span><strong>{money(total)}</strong></div><p>Agenda, local e adequação clínica devem ser confirmados antes do atendimento. O carrinho não agenda automaticamente.</p>{error && <p role="alert" className="petflow-cart-error">{error}</p>}<button type="button" className="petflow-cart-pay" disabled={!PAYMENT_READY || busy} onClick={() => void checkout()}>{PAYMENT_READY ? busy ? "Abrindo pagamento…" : "Pagar com segurança" : "Pagamento online em configuração"}</button><a href="/atendimento#pre-cadastro" onClick={() => setOpen(false)}>Fazer pré-cadastro</a></footer>}</aside></div>;
}
