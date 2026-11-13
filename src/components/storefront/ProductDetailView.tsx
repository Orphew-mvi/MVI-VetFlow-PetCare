import { useState } from "react";
import { useProductDetail } from "../../hooks/storefront/useProductDetail";
import OptionPicker from "./OptionPicker";
import type { ProductDetail } from "../../wix/storefront/types";

export default function ProductDetailView(props: { initial?: ProductDetail | null; slug?: string }) {
  const d = useProductDetail(props);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  if (d.notFound) return <div className="shop-wrap"><h1>Produto não encontrado</h1><a href="/shop">Voltar ao catálogo</a></div>;
  if (!d.product) return <div className="shop-wrap">Carregando produto…</div>;
  const p = d.product;
  const obstetricProduct = p.id === "4be61856-8bfe-4733-af82-6080f033414d";
  const mainImage = obstetricProduct ? p.imageUrl : (selectedImage || d.imageUrl || p.gallery[0] || "");
  return <div className="shop-wrap">
    <nav aria-label="Caminho" className="mb-5 text-sm text-muted-foreground"><a href="/">Início</a>{p.breadcrumbs.map(c => <span key={c.id}> › <a href={`/category/${c.slug}`}>{c.name}</a></span>)} › {p.name}</nav>
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <div className={`grid min-h-56 place-items-center overflow-hidden rounded-lg bg-secondary ${obstetricProduct ? "aspect-square" : "max-h-[43vh] md:max-h-none"}`}>{mainImage ? <img src={mainImage} alt={p.name} className={obstetricProduct ? "h-full w-full object-cover" : "max-h-full w-full object-contain"} /> : <span>Imagem em preparação</span>}</div>
        {p.gallery.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto">{p.gallery.map((url, i) => <button type="button" key={url} onClick={() => setSelectedImage(url)} aria-label={`Ver imagem ${i+1}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border"><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
      </div>
      <div>
        {p.ribbons.length > 0 && <div className="flex flex-wrap gap-2">{p.ribbons.map((r, i) => <span key={i} className="rounded-full bg-secondary px-3 py-1 text-sm">{r}</span>)}</div>}
        <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">{p.name}</h1>
        <p className="mt-4 text-2xl font-bold">{d.price}</p>
        {d.compareAtPrice && <p className="text-sm text-muted-foreground">Antes: <s>{d.compareAtPrice}</s></p>}
        {d.pricePerUnit && <p className="text-sm text-muted-foreground">{d.pricePerUnit}</p>}
        {p.discountNames.length > 0 && <p className="text-sm text-muted-foreground">{p.discountNames.join(" · ")}</p>}
        <div className="mt-5"><OptionPicker detail={d} showQuantity /></div>
        {p.descriptionHtml && <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} />}
        {p.infoSections.map((section, i) => <section key={i} className="mt-6 border-t border-border pt-4"><h2 className="font-bold">{section.title}</h2><div dangerouslySetInnerHTML={{ __html: section.html }} /></section>)}
      </div>
    </div>
  </div>;
}
