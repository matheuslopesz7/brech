import { useEffect, useState } from "react";
import { Loader2, ShoppingBag, Trash2, Truck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cartStore";
import { useReservationStore } from "@/stores/reservationStore";
import { formatPrice } from "@/lib/shopify";

function simulateShipping(cep: string) {
  const d = cep.replace(/\D/g, "");
  if (d.length !== 8) return null;
  const region = Number(d[0]);
  const base = region <= 3 ? 18.9 : region <= 6 ? 24.9 : 32.9;
  const days = region <= 3 ? "3 a 5" : region <= 6 ? "5 a 8" : "7 a 12";
  return { price: base, days };
}

export function CartDrawer() {
  const { items, isLoading, isSyncing, removeItem, getCheckoutUrl, syncCart, isOpen, setOpen, clearCart } = useCartStore();
  const reserve = useReservationStore((s) => s.reserve);
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState<{ price: number; days: string } | null>(null);

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  const currency = items[0]?.price.currencyCode || "BRL";
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price.amount), 0);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (!url) return;
    const res = reserve(
      items.map((i) => ({
        productId: i.product.node.id,
        title: i.product.node.title,
        image: i.product.node.images.edges[0]?.node.url,
        price: i.price.amount,
      })),
    );
    if (!res.ok) {
      toast.error("Peça indisponível", { description: `Já reservada ou vendida: ${res.blocked.join(", ")}`, position: "top-center" });
      return;
    }
    window.open(url, "_blank");
    toast.success("Pedido registrado!", { description: "Suas peças ficam reservadas por 24h até a confirmação do pagamento.", position: "top-center" });
    clearCart();
    setOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex h-full w-full flex-col bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl uppercase tracking-wide">Sua sacola</SheetTitle>
          <SheetDescription>
            {items.length === 0 ? "Sua sacola está vazia" : `${items.length} peça${items.length > 1 ? "s" : ""} única${items.length > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center text-muted-foreground">
            <div>
              <ShoppingBag className="mx-auto mb-3 h-12 w-12" />
              <p>Nenhum garimpo por aqui ainda.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4">
              {items.map((i) => (
                <div key={i.variantId} className="flex gap-3 rounded-xl bg-card p-2 shadow-soft">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {i.product.node.images.edges[0] && (
                      <img src={i.product.node.images.edges[0].node.url} alt={i.product.node.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.product.node.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.selectedOptions.filter((o) => o.value !== "Default Title").map((o) => o.value).join(" • ") || "Peça única"} · Qtd 1
                    </p>
                    <p className="mt-1 font-semibold">{formatPrice(i.price.amount, i.price.currencyCode)}</p>
                  </div>
                  <button aria-label="Remover" onClick={() => removeItem(i.variantId)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/[^\d-]/g, "").slice(0, 9))}
                    placeholder="Calcular frete (CEP)"
                    className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-olive"
                  />
                </div>
                <button
                  onClick={() => {
                    const r = simulateShipping(cep);
                    if (!r) toast.error("CEP inválido", { position: "top-center" });
                    setShipping(r);
                  }}
                  className="h-10 rounded-full border border-foreground px-4 text-sm font-medium hover:bg-foreground hover:text-background"
                >
                  OK
                </button>
              </div>
              {shipping && (
                <p className="text-sm text-muted-foreground">
                  Frete estimado: <strong className="text-foreground">{formatPrice(shipping.price, currency)}</strong> · {shipping.days} dias úteis
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold">{formatPrice(subtotal + (shipping?.price ?? 0), currency)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isLoading || isSyncing}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-olive font-semibold uppercase tracking-wider text-olive-foreground shadow-soft transition hover:brightness-110 disabled:opacity-60"
              >
                {isLoading || isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ExternalLink className="h-4 w-4" />Finalizar compra</>}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
