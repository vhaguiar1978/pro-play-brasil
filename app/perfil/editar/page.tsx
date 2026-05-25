"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Crown,
  Lock,
  Loader2,
  Mail,
  Monitor,
  Phone,
  Radio,
  Save,
  Sparkles,
  Trash2,
  Tv,
  User,
  UserCircle,
  X
} from "lucide-react";
import { GAMES } from "@/lib/games";
import { ButtonLink } from "@/components/ui/button";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { invalidatePlayerAvatar, usePlayerAvatar } from "@/lib/use-player-avatar";
import { invalidatePlayerBadge, usePlayerBadgeLogo } from "@/lib/use-player-badge";
import {
  readArenaProfile,
  writeArenaProfile,
  type ArenaProfileIdentity
} from "@/lib/profile-storage";
import { cn } from "@/lib/utils";

type Platform = ArenaProfileIdentity["platform"];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "PC", label: "PC" },
  { value: "PlayStation", label: "PlayStation" },
  { value: "Xbox", label: "Xbox" },
  { value: "Mobile", label: "Mobile" },
  { value: "Crossplay", label: "Crossplay" }
];

const EMPTY: ArenaProfileIdentity = {
  fullName: "",
  gamertag: "",
  platform: "PC",
  email: "",
  whatsapp: "",
  twitch: "",
  teamByGame: {}
};

type StreamInfo = {
  isLive: boolean;
  gameSlug: string;
  twitchUrl: string;
  title: string;
};

export default function EditarPerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ArenaProfileIdentity>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modo transmissão (busca/registra no server)
  const [stream, setStream] = useState<StreamInfo>({
    isLive: false,
    gameSlug: GAMES[0]?.slug ?? "",
    twitchUrl: "",
    title: ""
  });
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Upload de avatar
  const currentAvatar = usePlayerAvatar(profile.gamertag.trim() ? profile.gamertag : null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Selo de campeão (badge)
  const currentBadgeLogo = usePlayerBadgeLogo(profile.gamertag.trim() ? profile.gamertag : null);
  const [badgeInfo, setBadgeInfo] = useState<{
    active: boolean;
    grantedBy: "champion" | "admin";
    grantedReason?: string;
    grantedAt: string;
  } | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  useEffect(() => {
    const existing = readArenaProfile();
    if (existing) {
      setProfile(existing);
      // Pré-preenche twitch URL com o que já tá no perfil
      if (existing.twitch) {
        setStream((p) => ({ ...p, twitchUrl: existing.twitch }));
      }
      // Busca se já está ao vivo
      fetch(`/api/streams`)
        .then((r) => r.json())
        .then((data) => {
          const mine = (data.streams ?? []).find(
            (s: { nickname: string }) =>
              s.nickname.toLowerCase() === existing.gamertag.trim().toLowerCase()
          );
          if (mine) {
            setStream({
              isLive: true,
              gameSlug: mine.gameSlug,
              twitchUrl: mine.twitchUrl,
              title: mine.title
            });
          }
        })
        .catch(() => {});
    }
    setLoaded(true);
  }, []);

  function setField<K extends keyof ArenaProfileIdentity>(field: K, value: ArenaProfileIdentity[K]) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!profile.gamertag.trim()) {
      setAvatarError("Salve seu gamertag antes de adicionar foto");
      return;
    }
    setAvatarError(null);
    setUploadingAvatar(true);
    setAvatarPreview(URL.createObjectURL(f));
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`/api/players/${encodeURIComponent(profile.gamertag.trim())}/avatar`, {
        method: "POST",
        body: fd
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload falhou");
      invalidatePlayerAvatar(profile.gamertag.trim());
      // Mantém preview até a próxima carga, mas força reload em outros lugares
      setTimeout(() => setAvatarPreview(null), 800);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Erro");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Busca o badge info quando o gamertag muda
  useEffect(() => {
    const nick = profile.gamertag.trim();
    if (!nick) {
      setBadgeInfo(null);
      return;
    }
    fetch(`/api/players/${encodeURIComponent(nick)}/badge`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.badge) {
          setBadgeInfo({
            active: data.badge.active,
            grantedBy: data.badge.grantedBy,
            grantedReason: data.badge.grantedReason,
            grantedAt: data.badge.grantedAt
          });
        } else {
          setBadgeInfo(null);
        }
      })
      .catch(() => setBadgeInfo(null));
  }, [profile.gamertag]);

  async function handleBadgePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const nick = profile.gamertag.trim();
    if (!nick) {
      setBadgeError("Defina seu gamertag primeiro");
      return;
    }
    setBadgeError(null);
    setUploadingBadge(true);
    setBadgePreview(URL.createObjectURL(f));
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`/api/players/${encodeURIComponent(nick)}/badge`, {
        method: "POST",
        body: fd
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload falhou");
      invalidatePlayerBadge(nick);
      setTimeout(() => setBadgePreview(null), 800);
    } catch (err) {
      setBadgeError(err instanceof Error ? err.message : "Erro");
      setBadgePreview(null);
    } finally {
      setUploadingBadge(false);
    }
  }

  async function removeAvatarPhoto() {
    if (!profile.gamertag.trim()) return;
    if (!confirm("Remover sua foto de perfil?")) return;
    try {
      await fetch(`/api/players/${encodeURIComponent(profile.gamertag.trim())}/avatar`, {
        method: "DELETE"
      });
      invalidatePlayerAvatar(profile.gamertag.trim());
      setAvatarPreview(null);
      // hack: força re-render
      window.location.reload();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Erro");
    }
  }

  async function goLive() {
    if (!profile.gamertag.trim()) {
      setStreamError("Salve seu gamertag antes de ir ao vivo");
      return;
    }
    setStreamLoading(true);
    setStreamError(null);
    try {
      const r = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: profile.gamertag.trim(),
          gameSlug: stream.gameSlug,
          twitchUrl: stream.twitchUrl,
          title: stream.title
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro");
      setStream({
        isLive: true,
        gameSlug: data.stream.gameSlug,
        twitchUrl: data.stream.twitchUrl,
        title: data.stream.title
      });
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : "Erro");
    } finally {
      setStreamLoading(false);
    }
  }

  async function stopLive() {
    setStreamLoading(true);
    setStreamError(null);
    try {
      const r = await fetch(
        `/api/streams?nickname=${encodeURIComponent(profile.gamertag.trim())}`,
        { method: "DELETE" }
      );
      if (!r.ok) throw new Error("Erro ao encerrar");
      setStream((p) => ({ ...p, isLive: false }));
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : "Erro");
    } finally {
      setStreamLoading(false);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!profile.gamertag.trim()) {
      setError("Gamertag é obrigatório");
      return;
    }
    setSaving(true);
    try {
      writeArenaProfile({
        ...profile,
        fullName: profile.fullName.trim(),
        gamertag: profile.gamertag.trim(),
        email: profile.email.trim(),
        whatsapp: profile.whatsapp.trim(),
        twitch: profile.twitch.trim()
      });
      setFlash("Perfil salvo!");
      setTimeout(() => {
        router.push(`/perfil/${encodeURIComponent(profile.gamertag.trim())}`);
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ppb-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-20 md:gap-14 md:pb-24">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-ppb-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ppb-primary/20 via-ppb-background to-ppb-background" />
        <div className="absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-ppb-primary/30 blur-[140px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-ppb-accent/20 blur-[140px]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-10 md:px-6 md:pb-12 md:pt-14">
          <Link
            href={profile.gamertag ? `/perfil/${encodeURIComponent(profile.gamertag)}` : "/perfil"}
            className="inline-flex items-center gap-2 rounded-full border border-ppb-border bg-ppb-surface/60 px-3 py-1.5 text-xs font-semibold text-ppb-muted backdrop-blur transition hover:border-ppb-primary/40 hover:text-ppb-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao perfil
          </Link>

          <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-end">
            {profile.gamertag ? (
              <PlayerAvatar nick={profile.gamertag} size="lg" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-ppb-subtle text-ppb-mutedSoft ring-1 ring-ppb-border">
                <UserCircle className="h-7 w-7" />
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-ppb-primary/30 bg-ppb-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ppb-primary backdrop-blur">
                <Sparkles className="h-3 w-3" />
                Editar perfil
              </div>
              <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.02em] text-white sm:text-5xl">
                {profile.gamertag || "Seu perfil"}
              </h1>
              <p className="mt-2 text-sm text-ppb-muted">
                Tudo o que você editar fica salvo no seu dispositivo. Nick e plataforma aparecem
                publicamente; e-mail, WhatsApp e nome ficam privados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <form onSubmit={handleSave} className="space-y-5">
          <Tabs
            defaultId="visual"
            items={[
              { id: "visual", label: "Visual", icon: <Camera className="h-4 w-4" />, content: (
                <div className="space-y-5">
          {/* FOTO DE PERFIL */}
          <FormCard
            title="Foto de perfil"
            subtitle="Aparece no seu perfil, ranking, brackets e em todo lugar que mostra seu nick."
            icon={<Camera className="h-5 w-5" />}
            tone="primary"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* Avatar grande preview */}
              <div className="relative">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-ppb-subtle ring-2 ring-ppb-border">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : currentAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentAvatar} alt="" className="h-full w-full object-cover" />
                  ) : profile.gamertag ? (
                    <PlayerAvatar
                      nick={profile.gamertag}
                      size="lg"
                      skipFetch
                      className="!h-24 !w-24"
                    />
                  ) : (
                    <UserCircle className="h-10 w-10 text-ppb-mutedSoft" />
                  )}
                </div>
                {uploadingAvatar ? (
                  <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ppb-background/70 backdrop-blur">
                    <Loader2 className="h-6 w-6 animate-spin text-ppb-primary" />
                  </div>
                ) : null}
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-xs leading-snug text-ppb-muted">
                  PNG, JPG ou WEBP até 3 MB. Quadrada funciona melhor (será cortada em círculo/retângulo).
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-ppb-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-ppb-glow transition hover:bg-ppb-primaryHover">
                    <Camera className="h-3.5 w-3.5" />
                    {currentAvatar ? "Trocar foto" : "Adicionar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarPick}
                      disabled={uploadingAvatar || !profile.gamertag.trim()}
                    />
                  </label>
                  {currentAvatar ? (
                    <button
                      type="button"
                      onClick={removeAvatarPhoto}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </button>
                  ) : null}
                </div>
                {!profile.gamertag.trim() ? (
                  <p className="text-[10px] text-amber-300">
                    Defina seu gamertag abaixo antes de enviar a foto.
                  </p>
                ) : null}
                {avatarError ? (
                  <p className="text-[10px] text-rose-300">{avatarError}</p>
                ) : null}
              </div>
            </div>
          </FormCard>

          {/* SELO DE CAMPEÃO */}
          {profile.gamertag.trim() ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl border p-6 shadow-ppb-card md:p-8",
                badgeInfo?.active
                  ? "border-ppb-gold/40 bg-gradient-to-br from-ppb-gold/10 via-ppb-surface to-ppb-surface shadow-[0_0_40px_rgba(243,178,79,0.18)]"
                  : "border-ppb-border bg-ppb-surface"
              )}
            >
              <div
                className={cn(
                  "absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl",
                  badgeInfo?.active ? "bg-ppb-gold/30" : "bg-ppb-mutedSoft/10"
                )}
              />
              <div className="relative">
                <div className="mb-5 flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
                      badgeInfo?.active
                        ? "bg-ppb-gold text-ppb-background ring-ppb-gold/60"
                        : "bg-ppb-subtle text-ppb-mutedSoft ring-ppb-border"
                    )}
                  >
                    {badgeInfo?.active ? <Crown className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <h2
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em]",
                        badgeInfo?.active ? "text-ppb-gold" : "text-ppb-mutedSoft"
                      )}
                    >
                      {badgeInfo?.active ? "👑 Você é campeão" : "Bloqueado"}
                    </h2>
                    <h3 className="font-display text-xl font-black uppercase text-ppb-text">
                      Logo de campeão
                    </h3>
                    <p className="mt-1 text-xs text-ppb-muted">
                      {badgeInfo?.active
                        ? "Você pode colocar um logo personalizado que vai aparecer ao lado do seu nome em ranking, brackets e perfis."
                        : "Esse selo é exclusivo de campeões. Vença um campeonato (ou seja liberado pelo admin) pra desbloquear o upload do seu logo."}
                    </p>
                    {badgeInfo?.active ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ppb-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ppb-gold ring-1 ring-ppb-gold/40">
                        {badgeInfo.grantedBy === "champion" ? "Por vitória" : "Liberado pelo admin"}
                        {badgeInfo.grantedReason ? ` · ${badgeInfo.grantedReason}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>

                {badgeInfo?.active ? (
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="relative">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-ppb-subtle ring-2 ring-ppb-gold/40">
                        {badgePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={badgePreview} alt="" className="h-full w-full object-cover" />
                        ) : currentBadgeLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={currentBadgeLogo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Crown className="h-8 w-8 text-ppb-gold" />
                        )}
                      </div>
                      {uploadingBadge ? (
                        <div className="absolute inset-0 grid place-items-center rounded-xl bg-ppb-background/70 backdrop-blur">
                          <Loader2 className="h-5 w-5 animate-spin text-ppb-gold" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs leading-snug text-ppb-muted">
                        PNG transparente fica melhor. Quadrado, até 2 MB.
                      </p>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-ppb-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ppb-background shadow-[0_0_24px_rgba(243,178,79,0.4)] transition hover:bg-ppb-gold/90">
                        <Camera className="h-3.5 w-3.5" />
                        {currentBadgeLogo ? "Trocar logo" : "Adicionar logo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleBadgePick}
                          disabled={uploadingBadge}
                        />
                      </label>
                      {badgeError ? (
                        <p className="text-[10px] text-rose-300">{badgeError}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
                </div>
              )},
              { id: "identidade", label: "Identidade", icon: <User className="h-4 w-4" />, content: (
                <div className="space-y-5">
          {/* DADOS GAMER (públicos) */}
          <FormCard
            title="Dados gamer"
            subtitle="Aparecem no seu perfil público pra outros jogadores."
            icon={<User className="h-5 w-5" />}
            tone="primary"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Gamertag *" hint="Como você aparece no ranking">
                <div className="relative">
                  <input
                    type="text"
                    value={profile.gamertag}
                    onChange={(e) => setField("gamertag", e.target.value)}
                    required
                    maxLength={40}
                    placeholder="ex: BRZ_Kaique"
                    className="ppb-form-input font-display text-base font-black uppercase"
                  />
                </div>
              </Field>

              <Field label="Plataforma principal">
                <select
                  value={profile.platform}
                  onChange={(e) => setField("platform", e.target.value as Platform)}
                  className="ppb-form-input"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Twitch (opcional)" hint="Aparece como link público" full>
                <div className="relative">
                  <Tv className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
                  <input
                    type="text"
                    value={profile.twitch}
                    onChange={(e) => setField("twitch", e.target.value)}
                    maxLength={40}
                    placeholder="seu_canal"
                    className="ppb-form-input pl-10"
                  />
                </div>
              </Field>
            </div>
          </FormCard>
                </div>
              )},
              { id: "transmissao", label: "Transmissão", icon: <Radio className="h-4 w-4" />, content: (
                <div className="space-y-5">
          {/* MODO TRANSMISSÃO */}
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl border p-6 shadow-ppb-card md:p-8 transition-colors",
              stream.isLive
                ? "border-rose-500/50 bg-gradient-to-br from-rose-500/10 via-ppb-surface to-ppb-surface"
                : "border-ppb-border bg-ppb-surface"
            )}
          >
            <div
              className={cn(
                "absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl",
                stream.isLive ? "bg-rose-500/30" : "bg-ppb-accent/15"
              )}
            />
            <div className="relative">
              <div className="mb-5 flex items-start gap-3">
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 transition-colors",
                    stream.isLive
                      ? "bg-rose-500 text-white ring-rose-500/60 animate-pulse"
                      : "bg-ppb-accent/15 text-ppb-accent ring-ppb-accent/40"
                  )}
                >
                  <Radio className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em]",
                      stream.isLive ? "text-rose-300" : "text-ppb-accent"
                    )}
                  >
                    {stream.isLive ? "🔴 No ar agora" : "Transmissão"}
                  </h2>
                  <h3 className="font-display text-xl font-black uppercase text-ppb-text">
                    Modo transmissão
                  </h3>
                  <p className="mt-1 text-xs text-ppb-muted">
                    Vai ao vivo na Twitch? Marca aqui pra aparecer no painel de transmissões
                    da plataforma e ser visto por outros jogadores.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Jogo que está jogando *">
                  <select
                    value={stream.gameSlug}
                    onChange={(e) => setStream((p) => ({ ...p, gameSlug: e.target.value }))}
                    disabled={stream.isLive || streamLoading}
                    className="ppb-form-input"
                  >
                    {GAMES.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Canal da Twitch *" hint="URL completa ou só o usuário">
                  <div className="relative">
                    <Tv className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
                    <input
                      type="text"
                      value={stream.twitchUrl}
                      onChange={(e) => setStream((p) => ({ ...p, twitchUrl: e.target.value }))}
                      disabled={stream.isLive || streamLoading}
                      maxLength={200}
                      placeholder="seu_canal ou https://twitch.tv/seu_canal"
                      className="ppb-form-input pl-10"
                    />
                  </div>
                </Field>

                <Field label="Título da transmissão" hint="Aparece nos cards. Ex: 'Subindo de patente, vem!'" full>
                  <input
                    type="text"
                    value={stream.title}
                    onChange={(e) => setStream((p) => ({ ...p, title: e.target.value }))}
                    disabled={stream.isLive || streamLoading}
                    maxLength={120}
                    placeholder="Título que aparece pros espectadores"
                    className="ppb-form-input"
                  />
                </Field>
              </div>

              {streamError ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {streamError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {stream.isLive ? (
                  <>
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-rose-400 shadow-[0_0_8px_currentColor]" />
                      Outros jogadores podem te ver agora
                    </div>
                    <button
                      type="button"
                      onClick={stopLive}
                      disabled={streamLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ppb-text transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
                    >
                      {streamLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      Encerrar transmissão
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-ppb-muted">
                      Só clica em <strong>Ir ao vivo</strong> quando estiver com a transmissão rolando.
                    </p>
                    <button
                      type="button"
                      onClick={goLive}
                      disabled={streamLoading || !stream.twitchUrl.trim() || !profile.gamertag.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(244,63,94,0.4)] transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {streamLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                      Ir ao vivo agora
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
                </div>
              )},
              { id: "privado", label: "Privado", icon: <Mail className="h-4 w-4" />, content: (
                <div className="space-y-5">
          {/* DADOS PESSOAIS (privados) */}
          <FormCard
            title="Dados pessoais"
            subtitle="Só você vê. Usamos pra contato e suporte."
            icon={<Mail className="h-5 w-5" />}
            tone="accent"
            privateNote
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo" full>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  maxLength={80}
                  placeholder="Seu nome"
                  className="ppb-form-input"
                />
              </Field>

              <Field label="E-mail">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setField("email", e.target.value)}
                    maxLength={100}
                    placeholder="voce@email.com"
                    className="ppb-form-input pl-10"
                  />
                </div>
              </Field>

              <Field label="WhatsApp">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppb-mutedSoft" />
                  <input
                    type="tel"
                    value={profile.whatsapp}
                    onChange={(e) => setField("whatsapp", e.target.value)}
                    maxLength={20}
                    placeholder="(11) 99999-9999"
                    className="ppb-form-input pl-10"
                  />
                </div>
              </Field>
            </div>
          </FormCard>
                </div>
              )}
            ]}
          />

          {/* FEEDBACK */}
          {error ? (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 ring-1 ring-rose-500/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {flash ? (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <Check className="h-4 w-4" />
              {flash}
            </div>
          ) : null}

          {/* AÇÕES */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={profile.gamertag ? `/perfil/${encodeURIComponent(profile.gamertag)}` : "/perfil"}
              className="rounded-xl border border-ppb-border bg-ppb-subtle px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ppb-muted transition hover:border-ppb-borderStrong hover:text-ppb-text"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || !profile.gamertag.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-ppb-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-ppb-glow-strong transition hover:bg-ppb-primaryHover disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar perfil
            </button>
          </div>
        </form>

        <style jsx global>{`
          .ppb-form-input {
            margin-top: 0.25rem;
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.10);
            background-color: rgba(17, 19, 26, 0.6);
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
            color: #ffffff;
          }
          .ppb-form-input::placeholder {
            color: rgba(255, 255, 255, 0.42);
          }
          .ppb-form-input:focus {
            outline: none;
            border-color: #FF6A00;
          }
        `}</style>
      </section>
    </div>
  );
}

function FormCard({
  title,
  subtitle,
  icon,
  tone,
  privateNote,
  children
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "primary" | "accent";
  privateNote?: boolean;
  children: React.ReactNode;
}) {
  const TONE = {
    primary: {
      iconBg: "bg-ppb-primary/15 text-ppb-primary ring-ppb-primary/40",
      eyebrow: "text-ppb-primary"
    },
    accent: {
      iconBg: "bg-ppb-accent/15 text-ppb-accent ring-ppb-accent/40",
      eyebrow: "text-ppb-accent"
    }
  }[tone];

  return (
    <div className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
      <div className="mb-5 flex items-start gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1", TONE.iconBg)}>
          {icon}
        </div>
        <div className="flex-1">
          <h2 className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", TONE.eyebrow)}>
            {privateNote ? "Privado" : "Público"}
          </h2>
          <h3 className="font-display text-xl font-black uppercase text-ppb-text">{title}</h3>
          <p className="mt-1 text-xs text-ppb-muted">{subtitle}</p>
        </div>
        {privateNote ? (
          <span className="hidden rounded-full bg-ppb-accent/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-ppb-accent ring-1 ring-ppb-accent/40 md:inline-flex">
            Só você vê
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  full,
  children
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft">
          {label}
        </label>
        {hint ? <span className="text-[10px] text-ppb-mutedSoft">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
