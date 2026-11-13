// Slide-over cart with quantity stepper (capped at the stock left), remove, struck line prices
// on discounted lines, per-line availability, a coupon field, a note to the merchant, the totals
// breakdown from the cart estimate (subtotal, named discounts, fees, taxes when prices exclude
// them, the total before shipping), and Wix-hosted checkout. Mount ONCE per page, as-is; opens via
// useCart().openCart() / CartButton. Styled from the @theme tokens.
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../hooks/storefront/useCart";
import type { CartLine } from "../../wix/storefront/types";

// Wix's line statuses in buyer words; IN_STOCK says nothing.
function lineStatusCopy(line: CartLine): string | null {
  switch (line.status) {
    case "IN_STOCK": return null;
    case "PARTIALLY_IN_STOCK": return line.availableQuantity !== null ? `Only ${line.availableQuantity} available — lower the quantity` : "Only part of this quantity is available";
    case "REMOVED_FROM_CATALOG": return "No longer sold";
    case "OUT_OF_STOCK": return "Out of stock";
    default: return "No longer available at this quantity";
  }
}

export default function CartDrawer() {
  const { cart, open, closeCart, busy, error, updateQuantity, removeLine } = useCart();
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/cart/mercado-pago", { cache: "no-store" })
      .then(response => response.json())
      .then(result => setPaymentReady(result.ready === true))
      .catch(() => setPaymentReady(false));
  }, [open]);

  async function startPayment() {
    if (!cart || cart.coupon || cart.discounts.length || cart.fees.length || cart.taxes.length || cart.currency !== "BRL") {
      setPaymentError("Este carrinho precisa ser conferido antes do pagamento. Remova cupons ou fale conosco.");
      return;
    }
    setPaymentBusy(true); setPaymentError("");
    try {
      const response = await fetch("/api/cart/mercado-pago", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: cart.lines.map(line => ({ productId: line.productId, quantity: line.quantity })) }),
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Pagamento indisponível.");
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : "Pagamento indisponível.");
      setPaymentBusy(false);
    }
  }

  // The overlay contract, done here rather than assumed from CSS: Escape closes (the backdrop
  // click is pointer-only), the page behind stops scrolling, focus moves into the panel on open
  // and returns to whatever opened it on close. Hooks run before the early return below.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open, closeCart]);

  if (!open) return null;
  const lines = cart?.lines ?? [];
  const row = "flex justify-between gap-3 text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-[2px]"
      onClick={closeCart}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-background text-foreground shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <span className="text-base font-semibold">
            Carrinho{cart && cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </span>
          <button
            type="button"
            aria-label="Fechar carrinho"
            onClick={closeCart}
            className="text-xl leading-none text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          )}
          {lines.map((line) => {
            const status = lineStatusCopy(line);
            const atMax = line.availableQuantity !== null && line.quantity >= line.availableQuantity;
            return (
              <div className="mb-6 flex gap-4" key={line.lineItemId}>
                {line.imageUrl ? (
                  <img
                    src={line.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-16 w-16 flex-shrink-0 rounded-md bg-secondary object-cover"
                  />
                ) : (
                  <div aria-hidden="true" className="h-16 w-16 flex-shrink-0 rounded-md bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{line.productName}</p>
                  {line.descriptionLines.map((d) => (
                    <p className="mt-0.5 text-xs text-muted-foreground" key={d}>
                      {d}
                    </p>
                  ))}
                  {line.subscription && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Subscription: {line.subscription}</p>
                  )}
                  {status && <p className="mt-1 text-xs text-destructive">{status}</p>}
                  <div className="mt-2 flex items-center">
                    <div className="inline-flex items-center gap-3 rounded-control border border-border px-2 py-0.5">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={busy || line.quantity <= 1}
                        onClick={() => updateQuantity(line.lineItemId, line.quantity - 1).catch(() => {})}
                        className="px-1 text-base disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="text-sm tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={busy || atMax}
                        onClick={() => updateQuantity(line.lineItemId, line.quantity + 1).catch(() => {})}
                        className="px-1 text-base disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeLine(line.lineItemId).catch(() => {})}
                      className="ml-3 text-xs text-muted-foreground underline transition-colors hover:text-foreground disabled:opacity-40"
                    >
                        Remover
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{line.linePrice}</p>
                  {line.compareAtLinePrice && <p className="text-xs text-muted-foreground line-through">{line.compareAtLinePrice}</p>}
                </div>
              </div>
            );
          })}

        </div>

        {lines.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="mb-3 flex flex-col gap-1.5">
              {cart?.subtotal && (
                <div className={row}>
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{cart.subtotal}</span>
                </div>
              )}
              {(cart?.discounts ?? []).map((d, i) => (
                <div className={row} key={`d${i}`}>
                  <span className="text-muted-foreground">{d.name || "Discount"}</span>
                  <span>−{d.amount}</span>
                </div>
              ))}
              {(cart?.fees ?? []).map((f, i) => (
                <div className={row} key={`f${i}`}>
                  <span className="text-muted-foreground">{f.name || "Fee"}</span>
                  <span>{f.amount}</span>
                </div>
              ))}
              {!cart?.pricesIncludeTax && (cart?.taxes ?? []).map((t, i) => (
                <div className={row} key={`t${i}`}>
                  <span className="text-muted-foreground">{t.name || "Tax"}</span>
                  <span>{t.amount}</span>
                </div>
              ))}
              {cart?.total && (
                <div className={`${row} mt-1 border-t border-border pt-2`}>
                  <span className="font-semibold">Total</span>
                  <strong className="font-semibold">{cart.total}</strong>
                </div>
              )}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Atendimento sujeito à confirmação de agenda, local e avaliação. O óleo ozonizado requer confirmação individual de protocolo, volume e entrega. Nenhum atendimento é agendado automaticamente pelo carrinho.
            </p>
            <p className="mb-3 text-xs text-muted-foreground">No Mercado Pago, selecione Pix e toque em Criar Pix para gerar o código. Se a tela ficar cortada em um aplicativo, abra o pagamento no navegador do celular.</p>
            {(error || paymentError) && <p className="mb-3 text-xs text-destructive" role="alert">{paymentError || error}</p>}
            <button
              type="button"
              disabled={busy || paymentBusy || !paymentReady}
              onClick={() => void startPayment()}
              className="w-full rounded-control bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {paymentBusy ? "Aguarde…" : paymentReady ? "Pagar com Pix ou cartão" : "Pagamento online em configuração"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
