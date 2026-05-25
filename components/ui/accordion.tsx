"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  content: ReactNode;
};

type Props = {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
};

export function Accordion({ items, defaultOpenId, className }: Props) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "overflow-hidden rounded-2xl border transition-all duration-300",
              open
                ? "border-ppb-primary/40 bg-ppb-surface shadow-ppb-card"
                : "border-ppb-border bg-ppb-surface/60 hover:border-ppb-borderStrong"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              {item.icon ? (
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition-colors",
                    open
                      ? "bg-ppb-primary text-white ring-ppb-primary/60"
                      : "bg-ppb-subtle text-ppb-primary ring-ppb-border"
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="flex-1 text-sm font-bold text-ppb-text md:text-base">{item.title}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-ppb-muted transition-transform duration-300",
                  open && "rotate-180 text-ppb-primary"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-0 text-sm leading-7 text-ppb-muted">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
