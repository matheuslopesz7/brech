import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, Loader2, Ruler, Sparkles } from "lucide-react";
import { fetchProductByHandle, formatPrice, getCondition, getMeasures, getSize } from "@/lib/shopify";
import { useAddToCart } from "@/components/store/ProductCard";
import { useReservationStore } from "@/stores/reservationStore";
import type { ShopifyProduct } from "@/lib/shopify";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle.replace(/-/g, " ")} — Brechó White Of Peace` },
      { name: "description", content: "Peça única do Brechó White Of Peace. Veja medidas, estado e garanta a sua." },
      { property: "og:title", content: "Peça única — Brechó White Of Peace" },
      { property: "og:description", content: "Achou, levou! Peça exclusiva com envio para todo o Brasil." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["product", handle], queryFn: () => fetchProductByHandle(handle) });

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!data) return <div className="py-32 text-center">Peça não encontrada. <Link to="/" className="underline">Voltar</Link></div>;
  return <Detail product={data} />;
}

function Detail({ product }: { product: ShopifyProduct }) {
  const p = product.node;
  const [idx, setIdx] = useState(0);
  const { add, busy, done, inCart, available } = useAddToCart(product);
  const status = useReservationStore((s) => s.isUnavailable(p.id));
  const images = p.images.edges.map((e) => e.node);
  const size = getSize(product);
  const measures = getMeasures(product);
  const condition = getCondition(product);
  const blocked = !!status || !available;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar à vitrine</Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-secondary shadow-soft">
            {images[idx] && <img src={images[idx].url} alt={images[idx].altText ?? p.title} className="h-full w-full object-cover" />}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((im, i) => (
                <button key={im.url} onClick={() => setIdx(i)} className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === idx ? "border-olive" : "border-transparent"}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="w-fit rounded-full bg-olive px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-olive-foreground">Peça única</span>
          <h1 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">{p.title}</h1>
          <p className="mt-4 text-3xl font-bold">{formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode)}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {size && <span className="rounded-full border border-border bg-card px-4 py-2">Tamanho <strong>{size}</strong></span>}
            {condition && <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2"><Sparkles className="h-4 w-4 text-olive" />{condition}</span>}
          </div>
          {p.description && <p className="mt-6 whitespace-pre-line text-muted-foreground">{p.description}</p>}
          {measures.length > 0 && (
            <div className="mt-6 rounded-2xl bg-card p-5 shadow-soft">
              <p className="mb-3 flex items-center gap-2 font-semibold"><Ruler className="h-4 w-4" />Medidas em cm</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {measures.map((m) => (
                  <div key={m.label} className="flex justify-between rounded-lg bg-secondary px-3 py-2"><span>{m.label}</span><strong>{m.value} cm</strong></div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={add}
            disabled={busy || inCart || blocked}
            className={`mt-8 flex h-14 items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-wider shadow-soft transition ${done || inCart ? "bg-olive text-olive-foreground" : "bg-primary text-primary-foreground hover:bg-olive"} disabled:opacity-80`}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" />
              : status ? (status === "vendida" ? "Vendida" : "Reservada")
              : !available ? "Indisponível"
              : done || inCart ? <><Check className="h-5 w-5 animate-pop" />Na sacola</>
              : "Adicionar ao carrinho"}
          </button>
        </div>
      </div>
    </div>
  );
}
