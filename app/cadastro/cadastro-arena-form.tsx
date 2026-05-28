"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GAMES } from "@/lib/games";
import { guardUserText } from "@/lib/content-guard";
import { findUserConflicts, getOrCreateDeviceId, upsertUserRegistryEntry } from "@/lib/user-registry";

type ProfileDraft = {
  fullName: string;
  cpf: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  email: string;
  password: string;
  gamertag: string;
  whatsapp: string;
  platform: "PC" | "PlayStation" | "Xbox" | "Mobile" | "Crossplay";
  twitch: string;
  bio: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  acceptedTerms: boolean;
  teamByGame: Record<string, string>;
};

type StoredProfileDraft = Partial<ProfileDraft> & {
  birth?: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

const KEY = "ppb_profile_draft_v1";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function parseLegacyBirthDate(value?: string) {
  if (!value) {
    return {
      birthDay: "",
      birthMonth: "",
      birthYear: ""
    };
  }

  const normalized = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-");
    return {
      birthDay: day,
      birthMonth: month,
      birthYear: year
    };
  }

  const digits = normalized.match(/\d+/g);
  if (!digits || digits.length < 3) {
    return {
      birthDay: "",
      birthMonth: "",
      birthYear: ""
    };
  }

  if (digits[0].length === 4) {
    const [year, month, day] = digits;
    return {
      birthDay: day?.slice(0, 2) ?? "",
      birthMonth: month?.slice(0, 2) ?? "",
      birthYear: year.slice(0, 4)
    };
  }

  const [day, month, year] = digits;
  return {
    birthDay: day?.slice(0, 2) ?? "",
    birthMonth: month?.slice(0, 2) ?? "",
    birthYear: year?.slice(0, 4) ?? ""
  };
}

function readDraft(): ProfileDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredProfileDraft;
    const legacyBirth = parseLegacyBirthDate(parsed.birth);

    return {
      fullName: parsed.fullName ?? "",
      cpf: parsed.cpf ?? "",
      birthDay: parsed.birthDay ?? legacyBirth.birthDay,
      birthMonth: parsed.birthMonth ?? legacyBirth.birthMonth,
      birthYear: parsed.birthYear ?? legacyBirth.birthYear,
      email: parsed.email ?? "",
      password: parsed.password ?? "",
      gamertag: parsed.gamertag ?? "",
      whatsapp: parsed.whatsapp ?? "",
      platform: parsed.platform ?? "PC",
      twitch: parsed.twitch ?? "",
      bio: parsed.bio ?? "",
      cep: onlyDigits(parsed.cep ?? "").slice(0, 8),
      address: parsed.address ?? "",
      number: parsed.number ?? "",
      complement: parsed.complement ?? "",
      city: parsed.city ?? "",
      state: parsed.state ?? "",
      acceptedTerms: parsed.acceptedTerms ?? false,
      teamByGame: parsed.teamByGame ?? {}
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: ProfileDraft) {
  localStorage.setItem(KEY, JSON.stringify(draft));
}

function isValidBirthDate(day: string, month: string, year: string) {
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
    return false;
  }

  const parsedDay = Number(day);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (!Number.isInteger(parsedDay) || !Number.isInteger(parsedMonth) || !Number.isInteger(parsedYear)) {
    return false;
  }

  const date = new Date(parsedYear, parsedMonth - 1, parsedDay);
  return (
    date.getFullYear() === parsedYear &&
    date.getMonth() === parsedMonth - 1 &&
    date.getDate() === parsedDay
  );
}

export function CadastroArenaForm() {
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gamertag, setGamertag] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [platform, setPlatform] = useState<ProfileDraft["platform"]>("PC");
  const [twitch, setTwitch] = useState("");
  const [bio, setBio] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [teamByGame, setTeamByGame] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cepMessage, setCepMessage] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  function buildDraft(overrides?: Partial<ProfileDraft>): ProfileDraft {
    return {
      fullName,
      cpf,
      birthDay,
      birthMonth,
      birthYear,
      email,
      password,
      gamertag,
      whatsapp,
      platform,
      twitch,
      bio,
      cep,
      address,
      number,
      complement,
      city,
      state,
      acceptedTerms,
      teamByGame,
      ...overrides
    };
  }

  function persist(overrides?: Partial<ProfileDraft>) {
    writeDraft(buildDraft(overrides));
  }

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;

    setFullName(draft.fullName);
    setCpf(draft.cpf);
    setBirthDay(draft.birthDay);
    setBirthMonth(draft.birthMonth);
    setBirthYear(draft.birthYear);
    setEmail(draft.email);
    setPassword(draft.password);
    setGamertag(draft.gamertag);
    setWhatsapp(draft.whatsapp);
    setPlatform(draft.platform);
    setTwitch(draft.twitch);
    setBio(draft.bio);
    setCep(draft.cep);
    setAddress(draft.address);
    setNumber(draft.number);
    setComplement(draft.complement);
    setCity(draft.city);
    setState(draft.state);
    setAcceptedTerms(draft.acceptedTerms);
    setTeamByGame(draft.teamByGame);
  }, []);

  useEffect(() => {
    if (cep.length === 0) {
      setCepMessage(null);
      return;
    }

    if (cep.length < 8) {
      setCepMessage("Digite os 8 numeros do CEP para buscar o endereco.");
      return;
    }

    let cancelled = false;

    async function fetchAddressByCep() {
      try {
        setCepMessage("Buscando endereco pelo CEP...");

        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel consultar o CEP.");
        }

        const data = (await response.json()) as ViaCepResponse;

        if (cancelled) return;

        if (data.erro) {
          setCepMessage("CEP nao encontrado. Confira o numero digitado.");
          return;
        }

        const nextAddress = data.logradouro?.trim() ?? "";
        const nextCity = data.localidade?.trim() ?? "";
        const nextState = data.uf?.trim() ?? "";

        setAddress(nextAddress);
        setCity(nextCity);
        setState(nextState);
        setCepMessage("Endereco preenchido automaticamente.");
        const currentDraft = readDraft();
        if (currentDraft) {
          writeDraft({
            ...currentDraft,
            cep,
            address: nextAddress,
            city: nextCity,
            state: nextState
          });
        }
      } catch {
        if (cancelled) return;
        setCepMessage("Nao foi possivel buscar o endereco agora. Voce pode preencher manualmente.");
      }
    }

    fetchAddressByCep();

    return () => {
      cancelled = true;
    };
  }, [cep]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!acceptedTerms) {
      setMessage("Voce precisa aceitar os Termos e a Politica de Privacidade.");
      return;
    }

    if (!isValidBirthDate(birthDay, birthMonth, birthYear)) {
      setMessage("Informe uma data de nascimento valida.");
      return;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setMessage("O endereco e obrigatorio.");
      return;
    }

    const bioText = bio.trim();
    const bioRes = bioText
      ? guardUserText(bioText, { min: 2, max: 300, allowLinks: false })
      : ({ ok: true, cleaned: "" } as const);

    if (!bioRes.ok) {
      setMessage(`Bio: ${bioRes.reason}`);
      return;
    }

    persist({
      address: trimmedAddress,
      bio: bioRes.cleaned
    });

    const currentDeviceId = getOrCreateDeviceId();
    const conflicts = findUserConflicts({
      fullName,
      cpf,
      email,
      gamertag,
      whatsapp,
      platform
    });
    const blockedConflict = conflicts.find((user) => user.status === "banned" || user.status === "penalized");
    if (blockedConflict) {
      setMessage(
        blockedConflict.status === "banned"
          ? "Este CPF, email ou gamertag esta bloqueado no sistema. Fale com o suporte."
          : "Este cadastro esta com penalizacao ativa. Fale com o suporte para regularizar."
      );
      return;
    }

    const duplicateConflict = conflicts.find(
      (user) =>
        user.email.trim().toLowerCase() === email.trim().toLowerCase() ||
        user.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, "") ||
        user.gamertag.trim().toLowerCase() === gamertag.trim().toLowerCase()
    );
    if (duplicateConflict && duplicateConflict.deviceId !== currentDeviceId) {
      setMessage("Ja existe cadastro com este CPF, email ou gamertag. Isso ajuda a evitar varias contas no site.");
      return;
    }

    upsertUserRegistryEntry({
      fullName,
      cpf,
      email,
      gamertag,
      whatsapp,
      platform
    });

    if (missingEnv) {
      setMessage("Perfil salvo localmente (modo offline). Configure o Supabase para criar a conta.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/arena` : undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName.trim(),
            gamertag: gamertag.trim(),
            whatsapp: whatsapp.trim(),
            platform,
            twitch: twitch.trim(),
            bio: bioRes.cleaned,
            cep: cep.trim(),
            address: trimmedAddress,
            number: number.trim(),
            complement: complement.trim(),
            city: city.trim(),
            state: state.trim(),
            team_by_game: teamByGame
          }
        }
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      try {
        await fetch("/api/notifications/new-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            gamertag: gamertag.trim(),
            platform,
            whatsapp: whatsapp.trim(),
            createdAt: new Date().toISOString()
          })
        });
      } catch {
        // O cadastro nao deve falhar se o alerta no WhatsApp estiver indisponivel.
      }
      setShowResendConfirmation(true);
      setMessage("Conta criada. Confirmando o email, seu perfil ja volta para a arena com os dados principais preparados.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao conectar ao Supabase.");
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmationEmail() {
    if (missingEnv || !email.trim()) return;

    setMessage(null);
    setResendLoading(true);
    try {
      const supabase = createClient();
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/arena` : undefined;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo
        }
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Enviamos um novo email de confirmacao. Confira sua caixa de entrada e o spam.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nao foi possivel reenviar o email agora.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <form className="stack ppb-signup-form" onSubmit={onSubmit}>
      <div className="card soft" style={{ padding: 16 }}>
        <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "linear-gradient(135deg, rgba(41,182,246,0.9), rgba(255,59,212,0.55))",
                border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
            <div>
              <strong style={{ fontSize: "1.15rem" }}>Bem-vindo a arena.</strong>
              <div className="muted" style={{ fontSize: "0.92rem" }}>
                Crie seu perfil gamer completo e ganhe seu Player ID automaticamente.
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" type="button" disabled title="Em breve: upload de avatar">
            Foto
          </button>
        </div>
      </div>

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Dados do jogador</h2>

        <div className="field">
          <label htmlFor="fullName">Nome completo</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              persist({ fullName: e.target.value });
            }}
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="split">
          <div className="field">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              value={cpf}
              onChange={(e) => {
                setCpf(e.target.value);
                persist({ cpf: e.target.value });
              }}
              placeholder="000.000.000-00"
              required
            />
          </div>
          <div className="field">
            <label>Data de nascimento</label>
            <div className="split" style={{ gridTemplateColumns: "0.8fr 0.8fr 1.2fr" }}>
              <input
                aria-label="Dia de nascimento"
                inputMode="numeric"
                value={birthDay}
                onChange={(e) => {
                  const next = onlyDigits(e.target.value).slice(0, 2);
                  setBirthDay(next);
                  persist({ birthDay: next });
                }}
                placeholder="DD"
                required
              />
              <input
                aria-label="Mes de nascimento"
                inputMode="numeric"
                value={birthMonth}
                onChange={(e) => {
                  const next = onlyDigits(e.target.value).slice(0, 2);
                  setBirthMonth(next);
                  persist({ birthMonth: next });
                }}
                placeholder="MM"
                required
              />
              <input
                aria-label="Ano de nascimento"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => {
                  const next = onlyDigits(e.target.value).slice(0, 4);
                  setBirthYear(next);
                  persist({ birthYear: next });
                }}
                placeholder="AAAA"
                required
              />
            </div>
          </div>
        </div>

        <div className="split">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                persist({ email: e.target.value });
              }}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="gamertag">Gamertag</label>
            <input
              id="gamertag"
              value={gamertag}
              onChange={(e) => {
                setGamertag(e.target.value);
                persist({ gamertag: e.target.value });
              }}
              placeholder="Seu nickname"
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="whats">WhatsApp</label>
          <input
            id="whats"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              persist({ whatsapp: e.target.value });
            }}
            placeholder="(11) 99999-9999"
            required
          />
        </div>

        <div className="pill-row" aria-label="Plataforma principal">
          {(["PC", "PlayStation", "Xbox", "Mobile", "Crossplay"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`pill ${platform === option ? "active" : ""}`}
              onClick={() => {
                setPlatform(option);
                persist({ platform: option });
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Time por jogo</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Voce pode definir um nome de time para cada jogo. Esse nome vai aparecer na tabela do torneio.
        </p>
        <div className="stack">
          {GAMES.map((game) => (
            <div key={game.slug} className="field">
              <label htmlFor={`team-${game.slug}`}>{game.name} - nome do time</label>
              <input
                id={`team-${game.slug}`}
                value={teamByGame[game.slug] ?? ""}
                onChange={(e) => {
                  const next = { ...teamByGame, [game.slug]: e.target.value };
                  setTeamByGame(next);
                  persist({ teamByGame: next });
                }}
                placeholder="Ex: Pro Play Wolves"
              />
            </div>
          ))}

          <div className="timer-banner" style={{ borderColor: "rgba(255, 213, 79, 0.25)" }}>
            <strong style={{ color: "#92400e" }}>Imagem do time (bloqueada)</strong>
            <span className="muted">
              A imagem ou escudo so libera para quem ganhar campeonato no site.
            </span>
          </div>
        </div>
      </div>

      <div className="card soft">
        <div className="field">
          <label htmlFor="twitch">Link da Twitch (opcional)</label>
          <input
            id="twitch"
            value={twitch}
            onChange={(e) => {
              setTwitch(e.target.value);
              persist({ twitch: e.target.value });
            }}
            placeholder="https://twitch.tv/seucanal"
          />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio do jogador (opcional)</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              persist({ bio: e.target.value });
            }}
            placeholder="Se quiser, conte um pouco sobre voce."
          />
        </div>
      </div>

      <div className="card soft">
        <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
          <div>
            <strong>Termos e Privacidade</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              Eu li e aceito os Termos de Uso e a Politica de Privacidade.
            </div>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span className="muted">Ler</span>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                persist({ acceptedTerms: e.target.checked });
              }}
              style={{ width: 18, height: 18 }}
            />
          </label>
        </div>
      </div>

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Endereco</h2>

        <div className="field">
          <label htmlFor="cep">CEP</label>
          <input
            id="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            value={formatCep(cep)}
            onChange={(e) => {
              const next = onlyDigits(e.target.value).slice(0, 8);
              setCep(next);
              persist({ cep: next });
            }}
            placeholder="00000-000"
            required
          />
          {cepMessage ? (
            <p className="muted" role="status" style={{ margin: "8px 0 0" }}>
              {cepMessage}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="address">Endereco</label>
          <input
            id="address"
            autoComplete="address-line1"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              persist({ address: e.target.value });
            }}
            placeholder="Rua ou avenida"
            required
          />
        </div>

        <div className="split">
          <div className="field">
            <label htmlFor="number">Numero</label>
            <input
              id="number"
              inputMode="numeric"
              autoComplete="address-line2"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                persist({ number: e.target.value });
              }}
              placeholder="123"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="complement">Complemento</label>
            <input
              id="complement"
              autoComplete="address-line2"
              value={complement}
              onChange={(e) => {
                setComplement(e.target.value);
                persist({ complement: e.target.value });
              }}
              placeholder="Apto, bloco, referencia"
            />
          </div>
        </div>

        <div className="split">
          <div className="field">
            <label htmlFor="city">Cidade</label>
            <input
              id="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                persist({ city: e.target.value });
              }}
              placeholder="Sao Paulo"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="state">Estado</label>
            <input
              id="state"
              autoComplete="address-level1"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                persist({ state: e.target.value });
              }}
              placeholder="SP"
              required
            />
          </div>
        </div>
      </div>

      <div className="card soft">
        <h2 style={{ marginTop: 0 }}>Senha</h2>
        <div className="field">
          <label htmlFor="password">Senha (min. 6)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              persist({ password: e.target.value });
            }}
            required
            minLength={6}
          />
        </div>

        {missingEnv ? (
          <p className="muted" role="status">
            Modo offline: configure <code>.env.local</code> do Supabase para criar conta real.
          </p>
        ) : null}

        <div className="inline-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Criando..." : "Entrar na Arena"}
          </button>
        </div>

        {showResendConfirmation ? (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={resendLoading || loading || missingEnv}
              onClick={resendConfirmationEmail}
              style={{ padding: "10px 14px", fontSize: "0.92rem" }}
            >
              {resendLoading ? "Reenviando email..." : "Reenviar email de confirmacao"}
            </button>
          </div>
        ) : null}

        {message ? (
          <p className="muted" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <style jsx global>{`
        .ppb-signup-form {
          gap: 1.25rem;
        }

        .ppb-signup-form .card.soft {
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(180deg, rgba(17, 24, 39, 0.88), rgba(12, 17, 27, 0.82));
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
          padding: 1.25rem;
        }

        .ppb-signup-form h2 {
          margin-bottom: 0.75rem;
          font-family: var(--font-display, inherit);
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: #f8fafc;
        }

        .ppb-signup-form .muted {
          color: #94a3b8;
        }

        .ppb-signup-form .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 0.9rem;
        }

        .ppb-signup-form .field label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .ppb-signup-form .split {
          display: grid;
          gap: 0.9rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ppb-signup-form input,
        .ppb-signup-form textarea,
        .ppb-signup-form select {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.72);
          padding: 0.85rem 0.95rem;
          font-size: 0.92rem;
          color: #f8fafc;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .ppb-signup-form input::placeholder,
        .ppb-signup-form textarea::placeholder {
          color: rgba(148, 163, 184, 0.72);
        }

        .ppb-signup-form input:focus,
        .ppb-signup-form textarea:focus,
        .ppb-signup-form select:focus {
          outline: none;
          border-color: rgba(255, 106, 0, 0.82);
          box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.16);
          background: rgba(15, 23, 42, 0.9);
        }

        .ppb-signup-form textarea {
          min-height: 110px;
          resize: vertical;
        }

        .ppb-signup-form .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.35rem;
        }

        .ppb-signup-form .pill {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(30, 41, 59, 0.72);
          padding: 0.55rem 0.9rem;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #cbd5e1;
          transition: all 0.2s ease;
        }

        .ppb-signup-form .pill.active {
          border-color: rgba(255, 106, 0, 0.55);
          background: rgba(255, 106, 0, 0.14);
          color: #fff;
          box-shadow: 0 0 24px rgba(255, 106, 0, 0.18);
        }

        .ppb-signup-form .inline-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .ppb-signup-form .btn {
          border-radius: 0.95rem;
          padding: 0.9rem 1.2rem;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .ppb-signup-form .btn-primary {
          border: 0;
          background: #ff6a00;
          color: #fff;
          box-shadow: 0 0 28px rgba(255, 106, 0, 0.28);
        }

        .ppb-signup-form .btn-primary:hover {
          background: #ff7b24;
        }

        .ppb-signup-form .btn-ghost {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(30, 41, 59, 0.65);
          color: #e2e8f0;
        }

        .ppb-signup-form .timer-banner {
          border-radius: 1rem;
          border: 1px solid rgba(255, 179, 71, 0.24);
          background: rgba(245, 158, 11, 0.08);
          padding: 0.9rem 1rem;
        }

        @media (max-width: 768px) {
          .ppb-signup-form .split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
}
