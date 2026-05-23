import "./globals.css";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Pro Play Brasil",
  description: "Plataforma premium de campeonatos de esports, times, ranking e operacao profissional."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
