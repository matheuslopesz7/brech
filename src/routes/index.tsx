import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { MessageSquareQuote, X } from "lucide-react";
import capa from "@/assets/capa.png.asset.json";
import { fetchProducts, getSize } from "@/lib/shopify";
import { ProductCard } from "@/components/store/ProductCard";
import { useFilterStore, normalize } from "@/stores/filterStore";
import { useReservationStore } from "@/stores/reservationStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brechó White Of Peace — Peças únicas com estilo urbano" },
      { name: "description", content: "Garimpos exclusivos: camisetas, tênis, vestidos e acessórios. Peças únicas com envio para todo o Brasil." },
      { property: "og:title", content: "Brechó White Of Peace — Peças únicas" },
      { property: "og:description", content: "Garimpos exclusivos com estilo urbano. Achou, levou!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SIZES = ["P", "M", "G", "GG"];

function Index() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts(100) });
  const { search, size, setSize, category, setCategory } = useFilterStore();
  const reservations = useReservationStore((s) => s.reservations);
  const purgeExpired = useReservationStore((s) => s.purgeExpired);

  useEffect(() => {
    purgeExpired();
    const t = setInterval(purgeExpired, 60_000);
    return () => clearInterval(t);
  }, [purgeExpired]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return products.filter((p) => {
      if (reservations[p.node.id]) return false;
      if (q && !normalize(p.node.title).includes(q)) return false;
      if (size) {
        const s = normalize(getSize(p) ?? "");
        if (size === "GG" ? !["gg", "xl", "gg/xl"].includes(s) : s !== normalize(size)) return false;
      }
      if (category) {
        const hay = [...p.node.tags, p.node.productType].map(normalize);
        if (category.gender && !hay.includes(category.gender)) return false;
        if (category.category) {
          const c = normalize(category.category);
          const singular = c.replace(/s$/, "");
          if (!hay.some((h) => h === c || h === singular)) return false;
        }
      }
      return true;
    });
  }, [products, search, size, category, reservations]);

  return (
    <>
      <section className="relative overflow-hidden bg-primary">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="text-primary-foreground">
            <p className="mb-4 inline-block rounded-full border border-primary-foreground/30 px-4 py-1 text-xs uppercase tracking-[0.25em]">Brechó conceitual</p>
            <h1 className="font-display text-6xl uppercase leading-[0.9] sm:text-7xl lg:text-8xl">
              Achou,<br /><span className="text-olive">levou.</span>
            </h1>
            <p className="mt-6 max-w-md text-base opacity-80">Peças únicas garimpadas a dedo. Streetwear, camisas de time e achados que não se repetem.</p>
            <a href="#vitrine" className="mt-8 inline-flex h-12 items-center rounded-full bg-olive px-8 font-semibold uppercase tracking-wider text-olive-foreground shadow-lift transition hover:brightness-110">
              Explorar garimpos
            </a>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-olive/40" />
            <img src={capa.url} alt="Capa oficial do Brechó White Of Peace" className="relative aspect-square w-full rounded-[2rem] object-cover shadow-lift" />
          </div>
        </div>
      </section>

      <section id="vitrine" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-4xl uppercase sm:text-5xl">Vitrine</h2>
            {category && (
              <button onClick={() => setCategory(null)} className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                {category.label} <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Todos", ...SIZES].map((s) => {
              const val = s === "Todos" ? null : s;
              const active = size === val;
              return (
                <button key={s} onClick={() => setSize(val)}
                  className={`h-10 min-w-10 rounded-full border px-4 text-sm font-semibold transition ${active ? "border-olive bg-olive text-olive-foreground" : "border-border bg-card hover:border-foreground"}`}>
                  {s === "GG" ? "GG/XL" : s}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/6] animate-pulse rounded-2xl bg-secondary" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
            No products found
            <p className="mt-1 text-sm">Nenhuma peça encontrada por aqui ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.node.id} product={p} />)}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl bg-sand p-10 text-center sm:p-14">
          <MessageSquareQuote className="mx-auto h-10 w-10 text-olive" />
          <h2 className="mt-4 font-display text-4xl uppercase">Quem garimpou, aprovou</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Ainda não temos depoimentos publicados. Comprou com a gente? Mande seu print no WhatsApp e apareça aqui!</p>
        </div>
      </section>
    </>
  );
}
