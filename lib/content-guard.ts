export type GuardResult =
  | { ok: true; cleaned: string }
  | { ok: false; reason: string; cleaned?: string };

function normalizeBasic(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase();
}

function looksLikeLink(s: string) {
  return /(https?:\/\/|www\.|discord\.gg\/|t\.me\/|@[\w._-]+|\.com\b|\.gg\b)/i.test(s);
}

// Lista curta e objetiva para MVP (pode evoluir para listas maiores + ML + revisão humana).
const BANNED_FRAGMENTS = [
  "puta",
  "puto",
  "pqp",
  "caralho",
  "porra",
  "merda",
  "foda",
  "fdp",
  "buceta",
  "piranha",
  "arromb",
  "desgra",
  "vsf",
  "vai se f",
  "idiota",
  "otario",
  "babaca",
  "retard",
  "viado",
  "bicha"
];

function containsBanned(input: string) {
  const n = normalizeBasic(input).replace(/[^a-z0-9\s]/g, " ");
  return BANNED_FRAGMENTS.some((frag) => n.includes(frag));
}

export function guardUserText(
  input: string,
  opts?: { min?: number; max?: number; allowLinks?: boolean }
): GuardResult {
  const min = opts?.min ?? 2;
  const max = opts?.max ?? 400;
  const allowLinks = opts?.allowLinks ?? false;

  const cleaned = input.replace(/\s+/g, " ").trim();
  if (cleaned.length < min) return { ok: false, reason: `Escreva pelo menos ${min} caracteres.` };
  if (cleaned.length > max) return { ok: false, reason: `Texto muito grande (máx. ${max} caracteres).` };

  if (!allowLinks && looksLikeLink(cleaned)) {
    return { ok: false, reason: "Links/contatos não são permitidos aqui." };
  }

  if (containsBanned(cleaned)) {
    return { ok: false, reason: "Seu texto contém palavras ofensivas/proibidas." };
  }

  return { ok: true, cleaned };
}

