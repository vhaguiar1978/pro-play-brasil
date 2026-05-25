// Helpers pra gerar URLs do WhatsApp Web (https://wa.me/...) e detectar
// se uma string parece ser um número de WhatsApp.
//
// Estratégia: tudo client-side, sem API paga. O admin clica em "Mandar WhatsApp"
// e abre uma aba nova com mensagem pré-preenchida no WhatsApp Web/app.

/** Extrai apenas dígitos de uma string. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normaliza um número pro formato internacional usado pelo wa.me (sem +, só dígitos).
 * - Se já tem código do país (55, 1, etc), mantém.
 * - Se tem 10 ou 11 dígitos (BR sem código), prefixa 55.
 * - Se tem menos que isso, retorna vazio (inválido).
 */
export function normalizeWhatsAppNumber(raw: string): string {
  const digits = onlyDigits(raw);
  if (!digits) return "";
  // Já tem código do país: 12 ou 13 dígitos (55 + 10/11 dígitos BR), ou 11+ pra outros
  if (digits.length >= 12) return digits;
  // BR sem código: 10 dígitos (fixo) ou 11 dígitos (celular)
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return "";
}

/**
 * Detecta se uma "tag livre" do usuário parece ser um número de WhatsApp.
 * Aceita coisas como "(11) 99999-9999", "11999999999", "+55 11 99999 9999".
 * Rejeita "@instagram", "discord#1234", "email@..." etc.
 */
export function isLikelyWhatsApp(tag: string): boolean {
  if (!tag) return false;
  // Rejeita imediatamente se contém arroba ou hashtag (Instagram/Discord/email)
  if (/[@#]/.test(tag)) return false;
  const digits = onlyDigits(tag);
  // 10 a 13 dígitos = celular BR ou internacional plausível
  return digits.length >= 10 && digits.length <= 13;
}

/**
 * Formata um número BR pra exibição: "+55 (11) 99999-9999" ou similar.
 */
export function formatWhatsAppDisplay(raw: string): string {
  const normalized = normalizeWhatsAppNumber(raw);
  if (!normalized) return raw;
  if (normalized.startsWith("55") && (normalized.length === 12 || normalized.length === 13)) {
    const country = normalized.slice(0, 2);
    const area = normalized.slice(2, 4);
    const rest = normalized.slice(4);
    const middle = rest.length === 9 ? `${rest.slice(0, 5)}-${rest.slice(5)}` : `${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `+${country} (${area}) ${middle}`;
  }
  return `+${normalized}`;
}

/**
 * Gera URL do WhatsApp Web com mensagem pré-preenchida.
 * Se `phone` estiver vazio, retorna apenas com o texto (abre menu de contatos).
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  const encoded = encodeURIComponent(message);
  if (!normalized) {
    return `https://wa.me/?text=${encoded}`;
  }
  return `https://wa.me/${normalized}?text=${encoded}`;
}
