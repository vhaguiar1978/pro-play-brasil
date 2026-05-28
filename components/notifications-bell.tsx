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
      const response = await fetch(`/api/notifications?nick=${encodeURIComponent(nick)}`, {
        cache: "no-store"
      });
      const data = await response.json();
      setItems((data?.notifications ?? []) as Notification[]);
      setUnread(Number(data?.unread ?? 0));
    } catch {
      // ignora
    } finally {
      setLoading(false);
    }
  }, [nick]);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchAll]);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    if (unread === 0) return;
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnread(0);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nick })
    });
  }

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnread((value) => Math.max(0, value - 1));
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
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl border transition",
          isDarkChrome
            ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            : "border-black bg-black text-white hover:bg-[#111111] hover:text-white"
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
            <div className="px-4 py-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-ppb-border bg-ppb-subtle/45 text-ppb-mutedSoft">
                <Bell className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-lg font-black uppercase text-white">Nenhuma notificação ainda</div>
              <div className="mt-2 text-sm text-ppb-mutedSoft">Resultados, confirmações e alertas da arena aparecem aqui.</div>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-ppb-border overflow-y-auto">
              {items.map((item) => {
                const inner = (
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        item.read ? "bg-transparent" : "bg-ppb-primary"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-bold",
                            item.read ? "text-ppb-mutedSoft" : "text-ppb-text"
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-mono text-ppb-mutedSoft">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ppb-mutedSoft">{item.body}</p>
                    </div>
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.link ? (
                      <Link
                        href={item.link}
                        onClick={() => {
                          if (!item.read) markOneRead(item.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "block px-4 py-3 transition hover:bg-ppb-subtle/40",
                          !item.read && "bg-ppb-primary/[0.03]"
                        )}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !item.read && markOneRead(item.id)}
                        className={cn(
                          "block w-full px-4 py-3 text-left transition hover:bg-ppb-subtle/40",
                          !item.read && "bg-ppb-primary/[0.03]"
                        )}
                      >
                        {inner}
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
