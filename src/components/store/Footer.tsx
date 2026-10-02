import { Instagram, MessageCircle, Music2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const WHATSAPP_URL = "https://wa.me/5511961395273?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20uma%20pe%C3%A7a.";

const FAQ = [
  ["As peças são realmente únicas?", "Sim! Cada peça tem só uma unidade. Achou, levou."],
  ["Como funciona a reserva?", "Ao finalizar a compra, a peça fica reservada por 24h até a confirmação do pagamento."],
  ["Posso trocar?", "Por serem peças de brechó, trocas apenas em caso de defeito não informado."],
];

export function Footer() {
  const social = [
    { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
    { icon: Music2, label: "TikTok", href: "https://tiktok.com" },
    { icon: MessageCircle, label: "WhatsApp", href: WHATSAPP_URL },
  ];
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl uppercase leading-none">Brechó White Of Peace</p>
          <p className="mt-3 text-sm opacity-70">Garimpos com estilo urbano e alma.</p>
          <div className="mt-6 flex gap-3">
            {social.map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/30 transition hover:-translate-y-1 hover:border-olive hover:bg-olive">
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="mb-3 font-display text-lg uppercase tracking-wide">Atendimento</p>
          <p className="opacity-80">contato@whiteofpeace.com.br</p>
          <p className="opacity-80">WhatsApp: (11) 96139-5273</p>
          <p className="opacity-80">Seg a Sex · 9h às 18h</p>
          <p className="opacity-80">Sáb · 9h às 13h</p>
        </div>
        <div>
          <p className="mb-3 font-display text-lg uppercase tracking-wide">Dúvidas frequentes</p>
          <Accordion type="single" collapsible>
            {FAQ.map(([q = "", a = ""]) => (
              <AccordionItem key={q} value={q} className="border-primary-foreground/20">
                <AccordionTrigger className="text-left text-sm">{q}</AccordionTrigger>
                <AccordionContent className="text-sm opacity-75">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 px-6 py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} Brechó White Of Peace · Todos os direitos reservados · Termos de uso
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-success text-primary-foreground shadow-lift transition hover:scale-110">
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
