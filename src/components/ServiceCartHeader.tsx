import { useEffect, useState } from "react";
import { openServiceCart, readServiceCart, subscribeServiceCart } from "../lib/petflow-service-cart";

export default function ServiceCartHeader() {
  const [count, setCount] = useState(0);
  useEffect(() => { const refresh = () => setCount(readServiceCart().reduce((sum, line) => sum + line.quantity, 0)); refresh(); return subscribeServiceCart(refresh); }, []);
  return <button type="button" className="petflow-cart-trigger" onClick={openServiceCart} aria-label={`Abrir carrinho, ${count} serviços`}><span aria-hidden="true">🛒</span>{count > 0 && <b>{count}</b>}</button>;
}
