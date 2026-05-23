import { Mail, MessageCircleMore, ShieldCheck } from "lucide-react";
import { ComplaintsWidget } from "@/components/complaints-widget";
import { supportCards } from "@/lib/site-content";

const icons = [ShieldCheck, MessageCircleMore, Mail];

export default function SuportePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-black tracking-tight text-ppb-text md:text-5xl">Suporte</h1>
        <p className="text-ppb-muted">Resolva problemas de campeonatos, pagamentos e times.</p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {supportCards.map((item, index) => {
          const Icon = icons[index] ?? ShieldCheck;

          return (
            <div
              key={item.title}
              className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ppb-primarySoft text-ppb-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-ppb-text">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ppb-muted">{item.description}</p>
              <p className="mt-6 text-sm font-semibold text-ppb-text">{item.contact}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-ppb-primary/20 bg-gradient-to-br from-ppb-primarySoft to-white p-8 shadow-ppb-card">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-ppb-text md:text-3xl">
            Abrir solicitação
          </h2>
          <p className="text-sm text-ppb-muted">
            Vai direto pro painel administrativo com contexto da página.
          </p>
        </div>
        <div className="mt-6">
          <ComplaintsWidget />
        </div>
      </div>
    </div>
  );
}
