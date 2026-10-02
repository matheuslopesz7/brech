import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useReservationStore } from "@/stores/reservationStore";
import { formatPrice } from "@/lib/shopify";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel de reservas — Brechó White Of Peace" },
      { name: "description", content: "Acompanhe peças reservadas e vendidas do brechó." },
      { property: "og:title", content: "Painel de reservas — White Of Peace" },
      { property: "og:description", content: "Controle de reservas de peças únicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function remaining(ms: number) {
  if (ms <= 0) return "expirada";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}min`;
}

function Admin() {
  const { reservations, confirm, release, purgeExpired } = useReservationStore();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    purgeExpired();
    const t = setInterval(() => { setNow(Date.now()); purgeExpired(); }, 30_000);
    return () => clearInterval(t);
  }, [purgeExpired]);
  const list = Object.values(reservations).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl uppercase">Painel de reservas</h1>
      <p className="mt-2 text-sm text-muted-foreground">Simulação neste navegador. Reservas não confirmadas em 24h voltam sozinhas para a vitrine.</p>
      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">Nenhuma reserva no momento.</div>
      ) : (
        <div className="mt-8 space-y-3">
          {list.map((r) => (
            <div key={r.productId} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl bg-card p-3 shadow-soft sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">{r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.orderId} · {formatPrice(r.price)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${r.status === "vendida" ? "bg-primary text-primary-foreground" : "bg-olive text-olive-foreground"}`}>
                  {r.status}{r.status === "reservada" && ` · ${remaining(r.expiresAt - now)}`}
                </span>
              </div>
              <div className="col-span-2 flex gap-2 sm:col-span-1">
                {r.status === "reservada" && (
                  <button onClick={() => confirm(r.productId)} className="h-9 rounded-full bg-olive px-4 text-sm font-semibold text-olive-foreground">Confirmar pagamento</button>
                )}
                <button onClick={() => release(r.productId)} className="h-9 rounded-full border border-border px-4 text-sm">Devolver à vitrine</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
