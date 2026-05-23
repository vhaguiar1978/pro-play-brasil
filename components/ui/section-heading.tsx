import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  theme?: "light" | "dark";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  theme = "light"
}: Props) {
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
              isDark
                ? "border border-white/12 bg-white/6 text-ppb-primary"
                : "border border-ppb-primary/20 bg-ppb-primarySoft text-ppb-primary"
            )}
          >
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-2">
          <h2
            className={cn(
              "text-3xl font-black tracking-tight md:text-4xl",
              isDark ? "text-white" : "text-ppb-text"
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cn(
                "text-sm leading-7 md:text-base",
                isDark ? "text-white/64" : "text-ppb-muted"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
