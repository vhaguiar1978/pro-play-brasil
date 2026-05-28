"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";
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
  const [loggedUser, setLoggedUser] = useState<{
    display: string;
    initial: string;
    /** Gamertag canônico — só preenchido quando o user setou de fato. Usado pra notificações. */
    gamertag: string | null;
  } | null>(null);
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
        setLoggedUser({
          display,
          initial: display[0]?.toUpperCase() ?? "U",
          gamertag: gamertag ?? null
        });
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
  const darkGhostButton =
    "border border-white/16 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/28 hover:bg-white/[0.12] hover:text-white";
  const darkPrimaryButton =
    "border border-ppb-primary/55 bg-[linear-gradient(135deg,rgba(255,106,0,0.98),rgba(255,138,61,0.94))] text-white shadow-[0_18px_40px_rgba(255,106,0,0.26)] hover:border-ppb-primary hover:bg-[linear-gradient(135deg,rgba(255,122,24,1),rgba(255,150,82,0.96))] hover:-translate-y-0.5";
  const lightBlackButton =
    "border border-black bg-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.16)] hover:border-black hover:bg-[#111111] hover:text-white";
  const lightBlackSoftButton =
    "border border-black/85 bg-black text-white hover:border-black hover:bg-[#111111] hover:text-white";

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
                      ? "border border-black bg-black text-white shadow-[0_12px_26px_rgba(0,0,0,0.12)]"
                      : "text-ppb-muted hover:border hover:border-black/18 hover:bg-black hover:text-white"
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
              {loggedUser.gamertag ? (
                <NotificationsBell nick={loggedUser.gamertag} isDarkChrome={isDarkChrome} />
              ) : null}
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2",
                  isDarkChrome ? "border border-ppb-border bg-ppb-subtle" : "border border-black bg-black text-white"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
                    isDarkChrome ? "bg-ppb-primary/15 text-ppb-primary" : "bg-[#2a1b10] text-[#ff8a3d]"
                  )}
                >
                  {loggedUser.initial}
                </div>
                <div className={cn("max-w-[120px] truncate text-sm font-medium", isDarkChrome ? "text-ppb-text" : "text-white")}>
                  {loggedUser.display}
                </div>
              </div>
              <Button
                variant="ghost"
                className={isDarkChrome ? darkGhostButton : lightBlackSoftButton}
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
                className={isDarkChrome ? darkGhostButton : lightBlackSoftButton}
              >
                Entrar
              </ButtonLink>
              <ButtonLink
                href={publicRoutes.joinChampionship}
                variant="primary"
                className={isDarkChrome ? darkPrimaryButton : lightBlackButton}
              >
                Entrar no campeonato
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            "ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl lg:hidden",
            isDarkChrome ? "border border-white/12 bg-white/8 text-white" : "border border-black bg-black text-white"
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
                        ? "border border-black bg-black text-white shadow-[0_12px_26px_rgba(0,0,0,0.12)]"
                        : "text-ppb-muted hover:border hover:border-black/18 hover:bg-black hover:text-white"
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
                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3",
                    isDarkChrome ? "border border-ppb-border bg-ppb-subtle" : "border border-black bg-black text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold",
                        isDarkChrome ? "bg-ppb-primary/15 text-ppb-primary" : "bg-[#2a1b10] text-[#ff8a3d]"
                      )}
                    >
                      {loggedUser.initial}
                    </div>
                    <div className={cn("text-sm font-medium", isDarkChrome ? "text-ppb-text" : "text-white")}>{loggedUser.display}</div>
                  </div>
                  {canSeeAdmin ? <Shield className="h-4 w-4 text-ppb-primary" /> : null}
                </div>
                <Button
                  variant="ghost"
                  className={isDarkChrome ? darkGhostButton : lightBlackSoftButton}
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
                  className={isDarkChrome ? darkGhostButton : lightBlackSoftButton}
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </ButtonLink>
                <ButtonLink
                  href={publicRoutes.joinChampionship}
                  variant="primary"
                  className={isDarkChrome ? darkPrimaryButton : lightBlackButton}
                  onClick={() => setMobileOpen(false)}
                >
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
