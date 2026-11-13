import { useShop } from "../../hooks/storefront/useShop";
import FilterPanel from "./FilterPanel";
import QuickAdd from "./QuickAdd";
import { imgAttrs } from "../../wix/media";
import type { Category, ProductSummary } from "../../wix/storefront/types";

const fullBleedArtwork = new Set([
  "983127cf-10cc-4cf9-9989-f3c0171afc11", // Óleo ozonizado
  "36a1d06a-ab42-4d2d-83e1-0216f52376de", // Vacina antirrábica
  "890db64e-17ed-41c5-9c0d-79fe0e030a7b", // Vacina multiviral canina
  "1842cb42-4688-401a-b35e-b85de25bb201", // Vacina multiviral felina
  "267aae1e-e9de-4813-b0de-d90e8b714132", // Consulta clínica de pequeno porte
  "75817cc0-6b40-45e5-bed8-92147ee08845", // Endoscopia
  "10fdc1d6-5c06-4418-bcf2-bf6aac46ac2c", // Consulta especialista de pequeno porte
  "7ced2f24-173f-4725-a741-0cb92b0f044f", // Consultoria de pequeno porte
  "2f9f167c-78ef-4a1a-bc2f-e8f4e8f7ddd3", // Consulta especialista de grande porte
]);

export default function ShopView(props: { initialProducts?: ProductSummary[]; initialCategories?: Category[]; initialCategoryId?: string | null }) {
  const shop = useShop(props);
  const { products, categories, loading, error, activeCategoryId } = shop;
  const top = categories.filter(c => !c.parentId).sort((a, b) => a.index - b.index || a.name.localeCompare(b.name));
  return <div className="mt-7">
    {top.length > 1 && <nav aria-label="Categorias" className="mb-6 flex flex-wrap gap-2">
      <a href="/shop" className="rounded-full border border-border px-4 py-2 text-sm no-underline">Todos</a>
      {top.map(c => <a key={c.id} href={`/category/${c.slug}`} aria-current={activeCategoryId === c.id ? "page" : undefined} className="rounded-full border border-border px-4 py-2 text-sm no-underline">{c.name}</a>)}
    </nav>}
    <FilterPanel shop={shop}>
      {error && <div role="alert" className="rounded-lg border border-border bg-secondary p-5">Não foi possível carregar o catálogo. <button type="button" onClick={() => shop.retry()} className="underline">Tentar novamente</button></div>}
      {products === null && <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{[0,1,2].map(n => <div key={n} className="aspect-square animate-pulse rounded-lg bg-secondary" />)}</div>}
      {products?.length === 0 && !error && <div className="shop-empty"><h2>Catálogo em preparação</h2><p>{shop.hasActiveFilters ? "Nenhum produto corresponde aos filtros escolhidos." : "Ainda não há produtos cadastrados. Estamos organizando a seleção antes de abrir as compras."}</p>{shop.hasActiveFilters && <button type="button" onClick={() => shop.clearFilters()} className="underline">Limpar filtros</button>}</div>}
      {products && products.length > 0 && <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        {products.map(p => <div key={p.id} className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-white p-3">
          <a href={`/products/${p.slug}`} className="min-w-0 no-underline">
            <div className="catalog-card-image relative mb-3 aspect-square overflow-hidden rounded-md bg-secondary">{p.imageUrl ? fullBleedArtwork.has(p.id) ? <img {...imgAttrs(p.imageUrl, "(min-width: 1280px) 25vw, (min-width: 640px) 42vw, 90vw")} alt={p.name} className={`catalog-card-art catalog-card-art--cover absolute inset-0 h-full w-full object-cover ${p.id === "890db64e-17ed-41c5-9c0d-79fe0e030a7b" ? "catalog-card-art--canine" : ""}`} /> : <><img {...imgAttrs(p.imageUrl, "(min-width: 1280px) 25vw, (min-width: 640px) 42vw, 90vw")} alt="" aria-hidden="true" className="catalog-card-backdrop absolute inset-0 h-full w-full object-cover" /><img {...imgAttrs(p.imageUrl, "(min-width: 1280px) 25vw, (min-width: 640px) 42vw, 90vw")} alt={p.name} className="catalog-card-art relative h-full w-full object-contain" /></> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Imagem em preparação</div>}{p.ribbons.map((r, i) => <span key={i} className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">{r}</span>)}</div>
            <h3 className="min-w-0 break-words font-semibold">{p.name}</h3>
            <p className="mt-1 font-bold">{p.fromPrice ? `A partir de ${p.price}` : p.price !== p.maxPrice ? `${p.price} – ${p.maxPrice}` : p.price}</p>
            {p.compareAtPrice && <p className="text-sm text-muted-foreground">Antes: <s>{p.compareAtPrice}</s></p>}
            {p.discountNames.length > 0 && <p className="text-xs text-muted-foreground">{p.discountNames.join(" · ")}</p>}
            {p.pricePerUnit && <p className="text-xs text-muted-foreground">{p.pricePerUnit}</p>}
            {p.swatches.length > 0 ? <div className="flex gap-1 py-2">{p.swatches.map((c, i) => <span key={i} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div> : p.optionsSummary && <p className="text-sm text-muted-foreground">{p.optionsSummary}</p>}
          </a>
          <QuickAdd product={p} />
        </div>)}
      </div>}
      {shop.hasMore && <button type="button" onClick={() => shop.loadMore()} disabled={shop.loadingMore} className="mt-7 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50">{shop.loadingMore ? "Carregando…" : "Ver mais produtos"}</button>}
    </FilterPanel>
  </div>;
}
