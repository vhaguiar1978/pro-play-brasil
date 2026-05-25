"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  content: ReactNode;
};

type Props = {
  items: TabItem[];
  defaultId?: string;
  className?: string;
};

export function Tabs({ items, defaultId, className }: Props) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200",
                isActive
                  ? "bg-ppb-primary text-white shadow-ppb-glow"
                  : "border border-ppb-border bg-ppb-surface/60 text-ppb-muted hover:border-ppb-borderStrong hover:text-ppb-text"
              )}
            >
              {item.icon ? (
                <span className={cn("transition-colors", isActive ? "text-white" : "text-ppb-primary")}>
                  {item.icon}
                </span>
              ) : null}
              <span className="uppercase tracking-wider text-xs">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-ppb-primary/15 text-ppb-primary"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="animate-[fadeIn_0.3s_ease-out]">{current?.content}</div>
    </div>
  );
}
