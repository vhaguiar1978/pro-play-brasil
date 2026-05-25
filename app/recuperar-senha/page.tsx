import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { RecoveryForm } from "./recovery-form";

const STEPS = [
  {
    icon: <Mail className="h-4 w-4" />,
    title: "Informe seu e-mail",
    desc: "O mesmo que você usou no cadastro."
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Receba o link seguro",
    desc: "Chega na sua caixa em segundos. Confere o spam."
  },
  {
    icon: <KeyRound className="h-4 w-4" />,
    title: "Crie uma nova senha",
    desc: "Define agora e já volta pra arena."
  }
];

export default function RecuperarSenhaPage() {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-64px)] flex-col items-stretch justify-center overflow-hidden bg-ppb-background py-12 md:py-16">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
      <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/30 blur-[140px]" />
      <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:px-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
        {/* COPY + PASSOS */}
        <div className="space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-mutedSoft backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Recuperar conta
          </div>

          <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl">
            Esqueceu
            <br />
            <span className="text-ppb-primary">a senha?</span>
          </h1>
          <p className="max-w-md text-base leading-7 text-white/75">
            Sem drama. Mandamos um link seguro pro seu e-mail e você volta pra arena em menos
            de um minuto.
          </p>

          <ul className="hidden space-y-3 lg:block">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 p-3 backdrop-blur"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
                  {s.icon}
                </span>
                <div>
                  <div className="text-sm font-bold text-ppb-text">
                    <span className="mr-2 font-mono text-ppb-primary">0{i + 1}.</span>
                    {s.title}
                  </div>
                  <div className="text-xs text-ppb-muted">{s.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* FORM */}
        <div className="rounded-3xl border border-ppb-primary/30 bg-ppb-surface p-6 shadow-ppb-glow md:p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase text-ppb-text">
                Redefinir senha
              </h2>
              <p className="text-xs text-ppb-muted">Vai um link seguro pro seu e-mail</p>
            </div>
          </div>

          <RecoveryForm />
        </div>
      </div>

      {/* PASSOS MOBILE */}
      <div className="mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-3 px-4 md:px-6 lg:hidden">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="flex items-start gap-3 rounded-2xl border border-ppb-border bg-ppb-surface/60 p-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ppb-primary/15 text-ppb-primary ring-1 ring-ppb-primary/30">
              {s.icon}
            </span>
            <div>
              <div className="text-sm font-bold text-ppb-text">
                <span className="mr-2 font-mono text-ppb-primary">0{i + 1}.</span>
                {s.title}
              </div>
              <div className="text-xs text-ppb-muted">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
