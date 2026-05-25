// Templates de mensagens pré-prontas para o painel de WhatsApp do admin.
// Cada template tem placeholders {nick}, {jogo}, {campeonato}, {data}
// que são substituídos no momento de gerar o link.

export type WhatsAppTemplateId =
  | "welcome"
  | "game-opened"
  | "tournament-reminder"
  | "support"
  | "custom";

export type WhatsAppTemplate = {
  id: WhatsAppTemplateId;
  label: string;
  description: string;
  body: string;
  /** Lista de variáveis suportadas (apenas pra documentar pro admin). */
  variables: string[];
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "welcome",
    label: "Boas-vindas",
    description: "Para jogador recém-cadastrado na plataforma.",
    body: `Opa {nick}, beleza? 👋

Aqui é da Pro Play Brasil. Vi que você acabou de criar sua conta — bem-vindo à arena!

Qualquer dúvida sobre os campeonatos, inscrições ou prêmios, é só me chamar por aqui mesmo.

Bons jogos! 🎮🏆`,
    variables: ["{nick}"]
  },
  {
    id: "game-opened",
    label: "Aviso: jogo liberado",
    description: "Pra quem clicou em \"Quero esse campeonato\" e o jogo foi liberado.",
    body: `E aí {nick}! 🔥

Lembra que você demonstrou interesse no campeonato de *{jogo}*? Pois é — está oficialmente liberado.

Já tem campeonato aberto com inscrições rolando. Bora?

👉 https://proplaybrasil.com.br/jogos/{slug}

Vai dar pra ver as datas, premiação e fazer sua inscrição direto. Qualquer coisa estou aqui.`,
    variables: ["{nick}", "{jogo}", "{slug}"]
  },
  {
    id: "tournament-reminder",
    label: "Lembrete de campeonato",
    description: "Lembrar inscritos do horário/data do próximo evento.",
    body: `Salve {nick}!

Lembrete: o *{campeonato}* começa em {data}.

Não esquece de fazer o check-in 15 min antes pra não perder a vaga.

Boa sorte! 💪`,
    variables: ["{nick}", "{campeonato}", "{data}"]
  },
  {
    id: "support",
    label: "Atendimento / suporte",
    description: "Resposta inicial pra suporte ou tira-dúvidas.",
    body: `Olá {nick}, tudo bem?

Aqui é da equipe Pro Play Brasil. Vi sua mensagem por aqui — me conta com mais detalhes o que você precisa que vou te ajudar.

Tô online agora.`,
    variables: ["{nick}"]
  },
  {
    id: "custom",
    label: "Mensagem livre",
    description: "Comece do zero — escreva o que quiser.",
    body: "",
    variables: []
  }
];

export function getTemplate(id: WhatsAppTemplateId): WhatsAppTemplate {
  return WHATSAPP_TEMPLATES.find((t) => t.id === id) ?? WHATSAPP_TEMPLATES[0];
}

export type TemplateVars = {
  nick?: string;
  jogo?: string;
  slug?: string;
  campeonato?: string;
  data?: string;
};

export function renderTemplate(template: WhatsAppTemplate, vars: TemplateVars): string {
  return template.body
    .replace(/\{nick\}/g, vars.nick || "jogador")
    .replace(/\{jogo\}/g, vars.jogo || "")
    .replace(/\{slug\}/g, vars.slug || "")
    .replace(/\{campeonato\}/g, vars.campeonato || "")
    .replace(/\{data\}/g, vars.data || "");
}
