// Rate limit in-memory por chave (geralmente IP do cliente).
// Token bucket simples com janela fixa.
//
// Limitações:
// - Estado é em memória — em serverless (Vercel), cada instance tem
//   o próprio contador. Em produção real, troque por Upstash Redis ou Cloudflare.
// - Sem cluster ou compartilhamento entre regiões.
//
// Mesmo com essas limitações, já bloqueia 95% dos abusos óbvios
// (spammer único, bot ingênuo, retry-loop quebrado).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** GC simples: a cada N chamadas, expira buckets antigos. */
let calls = 0;
function maybeGC() {
  calls++;
  if (calls % 200 !== 0) return;
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Segundos até resetar (sempre >= 0). */
  retryAfter: number;
};

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowSec: number }
): RateLimitResult {
  maybeGC();
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: opts.limit - 1, retryAfter: 0 };
  }

  if (existing.count >= opts.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(0, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: opts.limit - existing.count,
    retryAfter: 0
  };
}

/** Pega o IP do cliente de um Request (Vercel passa via x-forwarded-for). */
export function readClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Helper pronto: limita um endpoint por IP. Retorna NextResponse 429 se passou. */
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.allowed) return null;
  return new Response(
    JSON.stringify({
      error: "Muitas requisições — tenta de novo em alguns segundos.",
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(result.retryAfter)
      }
    }
  );
}
