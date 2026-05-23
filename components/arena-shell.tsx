"use client";

export function ArenaShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="arena-shell">
      <main className="arena-main">{children}</main>
    </div>
  );
}
