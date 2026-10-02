import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { CategorySheet } from "./CategorySheet";
import { useCartStore } from "@/stores/cartStore";
import { useFilterStore } from "@/stores/filterStore";

export function TickerBar() {
  const text = "⚡ Peças únicas e exclusivas. Achou, levou! • Envio para todo o Brasil • ";
  return (
    <div className="overflow-hidden bg-primary py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="px-4">{text}</span>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const count = useCartStore((s) => s.items.length);
  const setOpen = useCartStore((s) => s.setOpen);
  const { search, setSearch } = useFilterStore();

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
        <button aria-label="Abrir menu" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="min-w-0 text-center">
          <span className="block truncate font-display text-xl uppercase leading-none tracking-wide sm:text-2xl">
            Brechó <span className="text-olive">White</span> Of Peace
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar peça..."
              className="h-10 w-52 rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-olive"
            />
          </div>
          <button aria-label="Buscar" onClick={() => setSearchOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary md:hidden">
            <Search className="h-5 w-5" />
          </button>
          <button aria-label="Carrinho" onClick={() => setOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span key={count} className="absolute -right-0.5 -top-0.5 grid h-5 w-5 animate-pop place-items-center rounded-full bg-olive text-[10px] font-bold text-olive-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar peça..."
            className="h-10 w-full rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-olive"
          />
        </div>
      )}
      <CategorySheet open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
}
