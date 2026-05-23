"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminAccess } from "@/lib/use-admin-access";
import { isRouteActive, publicRoutes } from "@/lib/public-routes";

const publicNav = [
  { href: publicRoutes.home, label: "Inicio" },
  { href: publicRoutes.games, label: "Jogos Oficiais" },
  { href: publicRoutes.tournaments, label: "Campeonatos" },
  { href: publicRoutes.ranking, label: "Ranking" },
  { href: publicRoutes.support, label: "Suporte" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState<{ display: string; initial: string } | null>(null);
  const { canAccess: canSeeAdmin } = useAdminAccess();
  const isDarkChrome = pathname === "/" || pathname === publicRoutes.home || pathname === "/nova-identidade";

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return;
      }

      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (user) {
        fetch("/api/profile/sync", { method: "POST" }).catch(() => undefined);
        const gamertag =
          user.user_metadata &&
          typeof user.user_metadata === "object" &&
          typeof user.user_metadata.gamertag === "string"
            ? user.user_metadata.gamertag
            : null;
        const display = gamertag || user.email?.split("@")[0] || "Usuario";
        setLoggedUser({ display, initial: display[0]?.toUpperCase() ?? "U" });
      } else {
        setLoggedUser(null);
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = publicRoutes.login;
  }

  const nav = canSeeAdmin ? [...publicNav, { href: "/admin", label: "Admin" }] : publicNav;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 backdrop-blur-xl transition-colors",
        isDarkChrome ? "border-b border-white/10 bg-[#05060a]/78" : "border-b border-ppb-border bg-white/85"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
        <Link href={publicRoutes.home} className="flex items-center gap-3">
          <Image
            src="/pro-play-arena-splash.png"
            alt="Pro Play Brasil"
            width={42}
            height={42}
            className={cn("rounded-2xl object-cover", isDarkChrome ? "border border-white/12" : "border border-ppb-border")}
            priority
          />
          <div className="hidden sm:block">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ppb-primary">PRO PLAY BRASIL</div>
            <div className={cn("text-sm", isDarkChrome ? "text-white/58" : "text-ppb-muted")}>
              Plataforma premium de esports
            </div>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  isDarkChrome
                    ? active
                      ? "bg-white/10 text-white"
                      : "text-white/62 hover:bg-white/8 hover:text-white"
                    : active
                      ? "bg-ppb-primary/10 text-ppb-text"
                      : "text-ppb-muted hover:bg-ppb-subtle hover:text-ppb-text"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loggedUser ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-ppb-border bg-ppb-subtle px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ppb-primary/15 text-sm font-bold text-ppb-primary">
                  {loggedUser.initial}
                </div>
                <div className="max-w-[120px] truncate text-sm font-medium text-ppb-text">{loggedUser.display}</div>
              </div>
              <Button
                variant="ghost"
                className={isDarkChrome ? "text-white/72 hover:bg-white/8 hover:text-white" : ""}
                onClick={handleSignOut}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <ButtonLink
                href={publicRoutes.login}
                variant="ghost"
                className={isDarkChrome ? "text-white/72 hover:bg-white/8 hover:text-white" : ""}
              >
                Entrar
              </ButtonLink>
              <ButtonLink href={publicRoutes.joinChampionship} variant="primary">
                Entrar no campeonato
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            "ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl lg:hidden",
            isDarkChrome ? "border border-white/12 bg-white/8 text-white" : "border border-ppb-border bg-ppb-subtle text-ppb-text"
          )}
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className={cn("border-t px-4 py-4 lg:hidden", isDarkChrome ? "border-white/10 bg-[#080a0f]" : "border-ppb-border bg-white")}>
          <nav className="grid gap-2">
            {nav.map((item) => {
              const active = isRouteActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isDarkChrome
                      ? active
                        ? "bg-white/10 text-white"
                        : "text-white/62 hover:bg-white/8 hover:text-white"
                      : active
                        ? "bg-ppb-primary/10 text-ppb-text"
                        : "text-ppb-muted hover:bg-ppb-subtle hover:text-ppb-text"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 grid gap-3">
            {loggedUser ? (
              <>
                <div className="flex items-center justify-between rounded-2xl border border-ppb-border bg-ppb-subtle px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ppb-primary/15 text-sm font-bold text-ppb-primary">
                      {loggedUser.initial}
                    </div>
                    <div className="text-sm font-medium text-ppb-text">{loggedUser.display}</div>
                  </div>
                  {canSeeAdmin ? <Shield className="h-4 w-4 text-ppb-primary" /> : null}
                </div>
                <Button
                  variant="ghost"
                  className={isDarkChrome ? "text-white/72 hover:bg-white/8 hover:text-white" : ""}
                  onClick={handleSignOut}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <ButtonLink
                  href={publicRoutes.login}
                  variant="ghost"
                  className={isDarkChrome ? "text-white/72 hover:bg-white/8 hover:text-white" : ""}
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </ButtonLink>
                <ButtonLink href={publicRoutes.joinChampionship} variant="primary" onClick={() => setMobileOpen(false)}>
                  Entrar no campeonato
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
