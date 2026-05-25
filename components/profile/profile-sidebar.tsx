"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ProfileNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
};

type Props = {
  items: ProfileNavItem[];
  className?: string;
};

export function ProfileSidebar({ items, className }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    const observers: IntersectionObserver[] = [];
    const callback = (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setActiveId(e.target.id);
        }
      }
    };
    const obs = new IntersectionObserver(callback, {
      rootMargin: "-30% 0px -50% 0px",
      threshold: 0
    });
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) obs.observe(el);
    }
    observers.push(obs);

    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  return (
    <nav className={cn("rounded-3xl border border-ppb-border bg-ppb-surface p-3", className)}>
      <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
        Navegar
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                  active
                    ? "bg-ppb-primary/15 ring-1 ring-ppb-primary/40"
                    : "hover:bg-ppb-subtle/60"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors",
                    active
                      ? "bg-ppb-primary text-white ring-ppb-primary/60"
                      : "bg-ppb-subtle text-ppb-primary ring-ppb-border"
                  )}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm font-bold uppercase tracking-wider",
                    active ? "text-ppb-text" : "text-ppb-muted"
                  )}
                >
                  {item.label}
                </span>
                {typeof item.count === "number" && item.count > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black",
                      active
                        ? "bg-ppb-primary text-white"
                        : "bg-ppb-subtle text-ppb-muted ring-1 ring-ppb-border"
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Versão mobile horizontal scroll */
export function ProfileNavTabs({ items, className }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  return (
    <nav
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              active
                ? "border-ppb-primary/60 bg-ppb-primary/15 text-ppb-text shadow-ppb-glow"
                : "border-ppb-border bg-ppb-surface/60 text-ppb-muted"
            )}
          >
            <span className={cn(active ? "text-ppb-primary" : "text-ppb-mutedSoft")}>{item.icon}</span>
            {item.label}
            {typeof item.count === "number" && item.count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  active ? "bg-ppb-primary text-white" : "bg-ppb-subtle"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}
