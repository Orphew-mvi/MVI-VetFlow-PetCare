export type ServiceLine = { id: string; title: string; price: number; quantity: number };
const key = "petflow-service-cart-v1";
const changed = "petflow:service-cart-changed";
const open = "petflow:service-cart-open";

export function readServiceCart(): ServiceLine[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((line): line is ServiceLine => typeof line?.id === "string" && typeof line?.title === "string" && typeof line?.price === "number" && Number.isInteger(line?.quantity) && line.quantity > 0) : [];
  } catch { return []; }
}

function write(lines: ServiceLine[]) {
  localStorage.setItem(key, JSON.stringify(lines));
  window.dispatchEvent(new Event(changed));
}

export function subscribeServiceCart(listener: () => void): () => void {
  window.addEventListener(changed, listener);
  return () => window.removeEventListener(changed, listener);
}

export function addService(line: Omit<ServiceLine, "quantity">) {
  const lines = readServiceCart();
  const current = lines.find(item => item.id === line.id);
  if (current) current.quantity = Math.min(10, current.quantity + 1);
  else lines.push({ ...line, quantity: 1 });
  write(lines);
  window.dispatchEvent(new Event(open));
}

export function setServiceQuantity(id: string, quantity: number) {
  write(readServiceCart().map(line => line.id === id ? { ...line, quantity } : line).filter(line => line.quantity > 0));
}

export function openServiceCart() { window.dispatchEvent(new Event(open)); }
export function onOpenServiceCart(listener: () => void): () => void {
  window.addEventListener(open, listener);
  return () => window.removeEventListener(open, listener);
}
