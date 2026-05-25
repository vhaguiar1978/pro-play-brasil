"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  title?: string;
  subtitle?: string;
  className?: string;
};

const FALLBACK_GRADIENTS = [
  "from-ppb-primary/40 via-ppb-primaryDeep/30 to-ppb-background",
  "from-ppb-accent/40 via-cyan-900/30 to-ppb-background",
  "from-fuchsia-500/30 via-purple-900/30 to-ppb-background",
  "from-emerald-500/30 via-teal-900/30 to-ppb-background"
];

function GalleryTile({
  src,
  className,
  fallbackIdx
}: {
  src: string;
  className?: string;
  fallbackIdx: number;
}) {
  const [errored, setErrored] = useState(false);
  const gradient = FALLBACK_GRADIENTS[fallbackIdx % FALLBACK_GRADIENTS.length];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-ppb-border bg-ppb-subtle shadow-ppb-card transition-all duration-300 hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:shadow-ppb-glow",
        className
      )}
    >
      {!errored ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <ImageOff className="h-8 w-8 text-white/30" />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ppb-background/80 via-ppb-background/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-tr from-ppb-primary/0 via-transparent to-ppb-accent/0 opacity-0 transition-opacity duration-500 group-hover:opacity-40 group-hover:from-ppb-primary/20 group-hover:to-ppb-accent/10" />
    </div>
  );
}

export function GameGallery({ images, title, subtitle, className }: Props) {
  if (images.length === 0) return null;
  const visible = images.slice(0, 4);

  return (
    <section className={cn("relative", className)}>
      {(title || subtitle) ? (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {subtitle ? (
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-primary">
                {subtitle}
              </div>
            ) : null}
            {title ? (
              <h2 className="font-display text-xl font-black uppercase tracking-wider text-ppb-text md:text-2xl">
                {title}
              </h2>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {visible.map((src, i) => (
          <GalleryTile
            key={src + i}
            src={src}
            fallbackIdx={i}
            className={cn(
              i === 0 && "col-span-2 md:col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto",
              i !== 0 && "aspect-[4/3]"
            )}
          />
        ))}
      </div>
    </section>
  );
}
