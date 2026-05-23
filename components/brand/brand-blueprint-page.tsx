import type { ComponentType } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Gamepad2,
  LayoutDashboard,
  Medal,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const palette = [
  { name: "Night Core", hex: "#070B12", usage: "Fundo principal e atmosfera premium" },
  { name: "Arena Surface", hex: "#0D1420", usage: "Cards, paineis e containers elevados" },
  { name: "Steel Layer", hex: "#111A28", usage: "Blocos secundarios e divisao de secoes" },
  { name: "Impact Orange", hex: "#FF6A00", usage: "CTA principal, inscricao e acoes quentes" },
  { name: "Neon Cyan", hex: "#35C2FF", usage: "Ao vivo, tecnologia, contraste e ritmo visual" },
  { name: "Victory Gold", hex: "#F3B24F", usage: "Premiacao, top 3 e destaques aspiracionais" }
];

const principles = [
  "A primeira dobra precisa vender a plataforma em segundos.",
  "Toda pagina importante deve ter CTA claro e visivel.",
  "O sistema inteiro precisa manter a mesma linguagem premium.",
  "Mobile first de verdade, sem sacrificar profundidade visual.",
  "A experiencia tem que parecer viva, competitiva e confiavel."
];

const pageBlocks = [
  {
    title: "Home de Alta Conversao",
    icon: Sparkles,
    points: ["Hero forte", "Jogos em destaque", "Campeonatos ativos", "Prova de confianca"]
  },
  {
    title: "Pagina de Campeonato",
    icon: Trophy,
    points: ["Premiacao grande", "Status claro", "Inscricao fixa", "Chaveamento legivel"]
  },
  {
    title: "Arena Logada",
    icon: MonitorPlay,
    points: ["Hub diario", "Proximas partidas", "Notificacoes", "Retorno recorrente"]
  },
  {
    title: "Admin Premium",
    icon: LayoutDashboard,
    points: ["Operacao rapida", "Filtros bons", "Dados claros", "Menos atrito"]
  }
];

const featureCards = [
  {
    title: "Atracao",
    icon: Gamepad2,
    copy: "Visual de arena premium com energia forte para destacar jogos, campeonatos e premiacoes sem cair em layout generico."
  },
  {
    title: "Conversao",
    icon: BadgeDollarSign,
    copy: "Botoes de acao muito claros, precos e vagas bem expostos e leitura rapida do campeonato para aumentar inscricoes."
  },
  {
    title: "Retencao",
    icon: Bell,
    copy: "Ranking, progresso, partidas ao vivo e area logada com cara de hub para o usuario querer voltar."
  }
];

export function BrandBlueprintPage() {
  return (
    <div className="min-h-screen bg-[#05070c] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.28),_transparent_26%),radial-gradient(circle_at_82%_18%,_rgba(53,194,255,0.18),_transparent_22%),linear-gradient(180deg,_#0a0d14_0%,_#05070c_52%,_#05070c_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08),_transparent)] opacity-50" />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-12 md:px-6 lg:pb-24 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/76 backdrop-blur">
                <CircleDot className="h-3.5 w-3.5 text-[#FF6A00]" />
                Direcao oficial do novo frontend
              </div>

              <div className="space-y-5">
                <h1 className="font-display text-4xl uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">
                  Arena Neon Premium para transformar o Pro Play Brasil em uma plataforma irresistivel.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
                  Fechamos uma identidade com cara de campeonato grande, CTA forte, atmosfera gamer premium, leitura
                  simples e estrutura pronta para home, campeonatos, arena logada e admin.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/inicio"
                  size="lg"
                  className="min-w-[220px] bg-[#FF6A00] shadow-[0_18px_44px_rgba(255,106,0,0.35)]"
                >
                  Voltar para a home
                </ButtonLink>
                <ButtonLink
                  href="/campeonatos"
                  variant="secondary"
                  size="lg"
                  className="min-w-[220px] border-white/14 bg-white/8 text-white hover:border-white/24 hover:bg-white/12 hover:text-white"
                >
                  Ver campeonatos atuais
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {featureCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[#35C2FF]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 text-lg font-black text-white">{item.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-white/58">{item.copy}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0d1420]/80 p-4 shadow-[0_28px_100px_rgba(0,0,0,0.4)] backdrop-blur">
              <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#09101a]">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#35C2FF]">
                        Preview de Home
                      </div>
                      <div className="mt-1 text-sm text-white/62">Impacto visual forte com foco em inscricao</div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Inscricoes abertas
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.22),_transparent_24%),linear-gradient(135deg,_rgba(17,26,40,0.98),_rgba(8,12,20,0.96))] p-5">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/74">
                      Campeonato em destaque
                    </div>
                    <h3 className="mt-4 font-display text-3xl uppercase leading-[0.92] tracking-[-0.05em] text-white">
                      Copa Elite de Free Fire
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-white/62">
                      Premio forte, status claro, transmissao ao vivo e CTA sempre visivel para acelerar decisao.
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-white/60">
                      <MetricBlock label="Premio" value="R$ 3.000" />
                      <MetricBlock label="Vagas" value="28/32" />
                      <MetricBlock label="Entrada" value="R$ 25" />
                    </div>
                    <div className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6A00] px-5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,106,0,0.35)]">
                      Entrar agora
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <PreviewPanel
                      eyebrow="Jogos"
                      title="Hubs por modalidade"
                      copy="Cada jogo com identidade propria sem quebrar a linguagem principal."
                    />
                    <PreviewPanel
                      eyebrow="Ranking"
                      title="Top 3 aspiracional"
                      copy="Destaque visual forte para status, pontuacao e senso de conquista."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2 xl:grid-cols-5">
            {principles.map((item, index) => (
              <div key={item} className="rounded-[1.3rem] border border-white/10 bg-black/18 p-4">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#35C2FF]">Pilar 0{index + 1}</div>
                <p className="mt-3 text-sm leading-7 text-white/66">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr,1.2fr]">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">
              Paleta oficial
            </div>
            <h2 className="font-display text-3xl uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-4xl">
              Cores que vendem competicao, confianca e desejo de entrar.
            </h2>
            <p className="max-w-xl text-sm leading-8 text-white/62 sm:text-base">
              A base escura cria premium e imersao. O laranja empurra a acao. O ciano injeta tecnologia e o dourado
              entra apenas onde existe conquista ou valor aspiracional.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {palette.map((item) => (
              <div key={item.hex} className="rounded-[1.6rem] border border-white/10 bg-[#0d1420]/78 p-4">
                <div className="h-28 rounded-[1.2rem] border border-white/10" style={{ backgroundColor: item.hex }} />
                <div className="mt-4 text-sm font-semibold text-white">{item.name}</div>
                <div className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-white/48">{item.hex}</div>
                <p className="mt-3 text-sm leading-7 text-white/58">{item.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#080c13]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#111826_0%,#0b111b_100%)] p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-[#35C2FF]/20 bg-[#35C2FF]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#35C2FF]">
                Tipografia e voz
              </div>
              <h2 className="mt-5 font-display text-4xl uppercase leading-[0.88] tracking-[-0.05em] text-white sm:text-5xl">
                Forte no impacto. Simples no uso.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-8 text-white/62 sm:text-base">
                Titulo com presenca de arena. Texto operacional limpo, direto e facil de escanear. O visual chama
                atencao, mas a linguagem continua simples e gostosa de usar.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <TypeCard
                  title="Display"
                  example="Orbitron / Rajdhani"
                  copy="Titulos, ranking, premiacao, banners e blocos hero."
                />
                <TypeCard
                  title="Interface"
                  example="Manrope / Sora"
                  copy="Formularios, tabelas, navegacao, texto e experiencia diaria."
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0d1420]/70 p-6 sm:p-8">
              <div className="inline-flex rounded-full border border-[#F3B24F]/20 bg-[#F3B24F]/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#F3B24F]">
                Componentes-chave
              </div>
              <div className="mt-6 grid gap-4">
                <ComponentRow
                  label="Botao primario"
                  accent="bg-[#FF6A00]"
                  value="Grande, forte e sempre facil de identificar"
                />
                <ComponentRow
                  label="Card de campeonato"
                  accent="bg-[#35C2FF]"
                  value="Imagem, status, premio, vagas e CTA em uma leitura so"
                />
                <ComponentRow
                  label="Badge de status"
                  accent="bg-[#22C55E]"
                  value="Ao vivo, aberto, pago, pendente e finalizado com leitura instantanea"
                />
                <ComponentRow
                  label="Ranking e top 3"
                  accent="bg-[#F3B24F]"
                  value="Tratamento especial para gerar desejo de acompanhar e subir"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="space-y-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#35C2FF]">
            Arquitetura das telas
          </div>
          <h2 className="font-display text-3xl uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-4xl">
            Um sistema inteiro com a mesma alma visual.
          </h2>
          <p className="max-w-3xl text-sm leading-8 text-white/62 sm:text-base">
            A estrategia nao e refazer uma pagina bonita isolada. E dar uma linguagem consistente para todas as partes
            importantes do produto, da home ate a operacao administrativa.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          {pageBlocks.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,26,40,0.96),rgba(8,12,20,0.92))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[#FF6A00]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-black text-white">{item.title}</h3>
                <div className="mt-4 grid gap-2">
                  {item.points.map((point) => (
                    <div key={point} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/68">
                      <div className="h-2 w-2 rounded-full bg-[#35C2FF]" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/8 bg-[linear-gradient(180deg,#0a0e16_0%,#06080d_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d1420]/76 p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#FF6A00]">
              Resultado esperado
            </div>
            <div className="mt-5 grid gap-4">
              <OutcomeRow icon={Users} title="Mais usuarios" copy="A primeira impressao sobe muito e o produto parece maior, mais serio e mais desejavel." />
              <OutcomeRow icon={ShieldCheck} title="Mais confianca" copy="Pagamento, inscricao e navegacao passam seguranca em vez de cara improvisada." />
              <OutcomeRow icon={Swords} title="Mais retorno" copy="Ranking, campeonatos e area logada ganham forca para o usuario voltar com mais frequencia." />
              <OutcomeRow icon={CalendarDays} title="Mais clareza" copy="O usuario entende o que fazer, o que esta ao vivo e onde entrar sem cansaco visual." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.22),_transparent_28%),linear-gradient(135deg,#121826_0%,#0a0f18_100%)] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#35C2FF]">
              Martelo final
            </div>
            <h2 className="mt-5 font-display text-3xl uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-4xl">
              Arena Neon Premium com estrutura SaaS Gamer Executive.
            </h2>
            <p className="mt-4 text-sm leading-8 text-white/66 sm:text-base">
              Essa e a rota mais forte para atrair mais gente, passar mais valor e deixar o uso diario mais gostoso.
              Ela entrega impacto onde precisa e clareza onde o sistema nao pode confundir.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Publico com cara de evento grande",
                "Campeonatos desenhados para conversao",
                "Arena logada com sensacao de movimento",
                "Admin premium sem perder produtividade"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/72">
                  <Medal className="h-4 w-4 text-[#F3B24F]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.05] px-3 py-3">
      <div className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function PreviewPanel({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#35C2FF]">{eyebrow}</div>
      <div className="mt-3 text-base font-black text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/56">{copy}</p>
    </div>
  );
}

function TypeCard({ title, example, copy }: { title: string; example: string; copy: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/42">{title}</div>
      <div className="mt-3 text-xl font-black text-white">{example}</div>
      <p className="mt-2 text-sm leading-7 text-white/58">{copy}</p>
    </div>
  );
}

function ComponentRow({ label, accent, value }: { label: string; accent: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className={`h-10 w-10 rounded-2xl ${accent} shadow-[0_0_30px_rgba(255,255,255,0.08)]`} />
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-1 text-sm text-white/56">{value}</div>
      </div>
    </div>
  );
}

function OutcomeRow({
  icon: Icon,
  title,
  copy
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[#35C2FF]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-base font-black text-white">{title}</div>
        <p className="mt-2 text-sm leading-7 text-white/58">{copy}</p>
      </div>
    </div>
  );
}
