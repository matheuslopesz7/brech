import { useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFilterStore, type CategoryFilter } from "@/stores/filterStore";

const GROUPS: { title: string; gender: "masculino" | "feminino"; items: string[] }[] = [
  { title: "Masculino", gender: "masculino", items: ["Camisetas", "Tênis", "Regatas", "Blusas"] },
  { title: "Feminino", gender: "feminino", items: ["Camisetas", "Saias", "Tênis", "Vestidos", "Blusas"] },
];
const OTHERS = ["Acessórios", "Mochilas", "Outros"];

export function CategorySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { category, setCategory } = useFilterStore();
  const navigate = useNavigate();

  const pick = (c: CategoryFilter | null) => {
    setCategory(c);
    onOpenChange(false);
    navigate({ to: "/" }).then(() => document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth" }));
  };
  const isActive = (g: string | null, c: string | null) => category?.gender === g && category?.category === c;
  const itemCls = (active: boolean) =>
    `block w-full rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-olive text-olive-foreground" : "hover:bg-secondary"}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl uppercase tracking-wide">Garimpos</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 space-y-6 px-4 pb-8">
          <button className={itemCls(category === null)} onClick={() => pick(null)}>Ver tudo</button>
          {GROUPS.map((g) => (
            <div key={g.gender}>
              <button
                onClick={() => pick({ gender: g.gender, category: null, label: g.title })}
                className="mb-2 font-display text-lg uppercase tracking-wide hover:text-olive"
              >
                {g.title}
              </button>
              <div className="space-y-1 border-l border-border pl-3">
                {g.items.map((it) => (
                  <button
                    key={it}
                    className={itemCls(isActive(g.gender, it))}
                    onClick={() => pick({ gender: g.gender, category: it, label: `${g.title} · ${it}` })}
                  >
                    {it}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-2 font-display text-lg uppercase tracking-wide">Acessórios e mais</p>
            <div className="space-y-1 border-l border-border pl-3">
              {OTHERS.map((it) => (
                <button key={it} className={itemCls(isActive(null, it))} onClick={() => pick({ gender: null, category: it, label: it })}>
                  {it}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
