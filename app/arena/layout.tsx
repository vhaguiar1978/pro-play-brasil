import { ArenaShell } from "@/components/arena-shell";

export default function ArenaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ArenaShell>{children}</ArenaShell>;
}

