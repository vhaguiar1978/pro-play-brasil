import Link from "next/link";
import { Camera, Play, ShieldCheck, Trophy } from "lucide-react";
import { ComplaintsWidget } from "@/components/complaints-widget";
import { SiteHeader } from "@/components/site-header";
import { publicRoutes } from "@/lib/public-routes";

export function SiteShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="site-root bg-ppb-background">
      <SiteHeader />
      <main className="site-main">{children}</main>
      <footer className="mt-auto border-t border-white/10 bg-[#07090d] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr] md:px-6">
          <div className="space-y-4">
            <Link href={publicRoutes.home} className="flex items-center gap-3 text-lg font-black text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                <Trophy className="h-6 w-6 text-ppb-primary" />
              </div>
              <span>PRO PLAY BRASIL</span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-white/60">
              Plataforma premium para campeonatos online, rankings, premiacao e comunidade competitiva.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Navegacao</h3>
            <div className="grid gap-3 text-sm text-white/62">
              <Link href={publicRoutes.home} className="hover:text-white">Inicio</Link>
              <Link href={publicRoutes.games} className="hover:text-white">Jogos</Link>
              <Link href={publicRoutes.tournaments} className="hover:text-white">Campeonatos</Link>
              <Link href={publicRoutes.ranking} className="hover:text-white">Ranking</Link>
              <Link href={publicRoutes.support} className="hover:text-white">Suporte</Link>
              <Link href={publicRoutes.terms} className="hover:text-white">Termos de Uso</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Contato</h3>
            <div className="grid gap-3 text-sm text-white/62">
              <Link href={publicRoutes.support} className="hover:text-white">Suporte</Link>
              <a href="mailto:contato@proplaybrasil.com.br" className="hover:text-white">contato@proplaybrasil.com.br</a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">Redes</h3>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-ppb-primary transition hover:border-ppb-primary/40 hover:bg-white/12"
              >
                <Camera className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-ppb-primary transition hover:border-ppb-primary/40 hover:bg-white/12"
              >
                <Play className="h-5 w-5" />
              </a>
              <Link
                href={publicRoutes.support}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-ppb-primary transition hover:border-ppb-primary/40 hover:bg-white/12"
              >
                <ShieldCheck className="h-5 w-5" />
              </Link>
            </div>
            <div className="pt-2">
              <ComplaintsWidget />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/44 md:px-6">
          {"(c)"} {currentYear} Pro Play Brasil. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
