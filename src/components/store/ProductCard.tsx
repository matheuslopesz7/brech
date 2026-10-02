import { Link } from "@tanstack/react-router";
import { Check, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type ShopifyProduct, formatPrice, getSize } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export function useAddToCart(product: ShopifyProduct) {
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.product.node.id === product.node.id));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const variant = product.node.variants.edges[0]?.node;

  const add = async () => {
    if (!variant || inCart) return;
    setBusy(true);
    const ok = await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    setBusy(false);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1600);
      toast.success("Adicionado à sacola", { description: product.node.title, position: "top-center" });
    }
  };
  return { add, busy, done, inCart, available: !!variant?.availableForSale };
}

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const p = product.node;
  const img = p.images.edges[0]?.node;
  const size = getSize(product);
  const { add, busy, done, inCart, available } = useAddToCart(product);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft transition hover:shadow-lift">
      <Link to="/product/$handle" params={{ handle: p.handle }} className="relative block aspect-[4/5] overflow-hidden bg-secondary">
        {img && <img src={img.url} alt={img.altText ?? p.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />}
        <span className="absolute left-3 top-3 rounded-full bg-olive px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-olive-foreground">Peça única</span>
        {size && <span className="absolute right-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-card px-2 text-xs font-bold">{size}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/product/$handle" params={{ handle: p.handle }} className="line-clamp-1 font-medium hover:text-olive">{p.title}</Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode)}</span>
          <button
            onClick={add}
            disabled={busy || inCart || !available}
            aria-label="Adicionar à sacola"
            className={`grid h-10 w-10 place-items-center rounded-full transition ${done || inCart ? "bg-olive text-olive-foreground" : "bg-primary text-primary-foreground hover:bg-olive"} disabled:cursor-default`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done || inCart ? <Check className="h-4 w-4 animate-pop" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
