// Header cart icon with a live count badge — mount once in your header, as-is.
// Opens the CartDrawer (mount that once too, anywhere in the page).
import { useCart } from "../../hooks/storefront/useCart";

export default function CartButton() {
  const { itemCount, openCart } = useCart();
  return (
    <button
      type="button"
      aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
      onClick={openCart}
      className={`petflow-header-cart ${itemCount > 0 ? "is-filled" : ""}`}
    >
      <svg className="petflow-cart-art" width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="petflow-cart-rim" x1="8" y1="7" x2="32" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff6c8" /><stop offset=".42" stopColor="#dfad45" /><stop offset="1" stopColor="#8b6427" />
          </linearGradient>
          <linearGradient id="petflow-cart-face" x1="12" y1="12" x2="30" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor={itemCount > 0 ? "#2f9d70" : "#4ab385"} /><stop offset=".55" stopColor="#13674c" /><stop offset="1" stopColor="#073c30" />
          </linearGradient>
          <radialGradient id="petflow-cart-wheel"><stop stopColor="#fff3b0" /><stop offset=".55" stopColor="#d1a13e" /><stop offset="1" stopColor="#61491f" /></radialGradient>
        </defs>
        <path d="M2.8 7.4h4.4l3.6 21.1c.2 1.2 1.2 2 2.4 2h18.4" stroke="#d5a84c" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 11.1 34.9 9l-3.8 16.3-18.4 2.1-3.2-16.3Z" fill="#052d25" stroke="url(#petflow-cart-rim)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m11.9 13.2 20.3-1.7-2.8 11.8-15 1.8-2.5-11.9Z" fill="url(#petflow-cart-face)" />
        <path d="m11.9 13.2 20.3-1.7-1 3.2-18.6 1.6-.7-3.1Z" fill="#f3d576" fillOpacity=".45" />
        <path d="m16.5 15.7 1.4 8.9m5.1-9.5.1 8.9m5.5-9.4-1.1 8.6" stroke="#d6ba68" strokeOpacity=".75" strokeWidth="1.1" />
        <path d="m13.9 25 15.8-1.9" stroke="#efcc75" strokeOpacity=".8" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="15.5" cy="34" r="3.1" fill="url(#petflow-cart-wheel)" stroke="#3e3016" strokeWidth=".8" />
        <circle cx="29.5" cy="34" r="3.1" fill="url(#petflow-cart-wheel)" stroke="#3e3016" strokeWidth=".8" />
        <circle cx="15.5" cy="34" r="1" fill="#fdf3bb" /><circle cx="29.5" cy="34" r="1" fill="#fdf3bb" />
      </svg>
      {itemCount > 0 && (
        <span className="petflow-header-cart-count">
          {itemCount}
        </span>
      )}
    </button>
  );
}
