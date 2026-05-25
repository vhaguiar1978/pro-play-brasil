"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  recipientNick: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Props = {
  nick: string;
  isDarkChrome?: boolean;
};

const POLL_MS = 30_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function NotificationsBell({ nick, isDarkChrome }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    if (!nick) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/notifications?nick=${encodeURIComponent(nick)}`, {
        cache: "no-store"
      });
      const data = await r.json();
      setItems((data?.notifications ?? []) as Notification[]);
      setUnread(Number(data?.unread ?? 0));
    } catch {
      /* ignora */
    } finally {
      setLoading(false);
    }
  }, [nick]);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    if (unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nick })
    });
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nick })
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl border transition",
          isDarkChrome
            ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            : "border-ppb-border bg-ppb-subtle text-ppb-muted hover:bg-ppb-subtle/80 hover:text-ppb-text"
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-ppb-primary px-1 font-mono text-[10px] font-black text-ppb-background ring-2 ring-ppb-background">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-ppb-border bg-ppb-surface shadow-2xl ring-1 ring-black/20 sm:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-ppb-border bg-ppb-subtle/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-ppb-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppb-text">
                Notificações
              </span>
              {unread > 0 ? (
                <span className="rounded-full bg-ppb-primary/15 px-1.5 py-px font-mono text-[10px] font-bold text-ppb-primary">
                  {unread}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft transition hover:text-ppb-text disabled:opacity-40"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </button>
          </div>

          {loading && items.length === 0 ? (
            <div className="grid place-items-center px-4 py-10 text-ppb-mutedSoft">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ppb-mutedSoft">
              Nenhuma notificação ainda.
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-ppb-border overflow-y-auto">
              {items.map((n) => {
                const Inner = (
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-ppb-primary"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-bold",
                            n.read ? "text-ppb-mutedSoft" : "text-ppb-text"
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-mono text-ppb-mutedSoft">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ppb-mutedSoft line-clamp-2">{n.body}</p>
                    </div>
                  </div>
                );

                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => {
                          if (!n.read) markOneRead(n.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "block px-4 py-3 transition hover:bg-ppb-subtle/40",
                          !n.read && "bg-ppb-primary/[0.03]"
                        )}
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.read && markOneRead(n.id)}
                        className={cn(
                          "block w-full px-4 py-3 text-left transition hover:bg-ppb-subtle/40",
                          !n.read && "bg-ppb-primary/[0.03]"
                        )}
                      >
                        {Inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
