import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  prize: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function PrizeBadge({ prize, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-ppb-gold/30 bg-gradient-to-r from-ppb-gold/15 via-ppb-gold/10 to-transparent font-black text-ppb-gold ring-1 ring-ppb-gold/10",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-base",
        className
      )}
    >
      <Trophy className={cn(size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
      <span className="truncate">{prize}</span>
    </div>
  );
}
