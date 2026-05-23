import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById } from "@/lib/mock-matches";
import { getTournamentById } from "@/lib/mock-tournaments";

type Props = { params: Promise<{ id: string }> };

export default async function PartidaPage({ params }: Props) {
  const { id } = await params;
  const m = getMatchById(id);
  if (!m) notFound();

  const t = getTournamentById(m.tournamentId);

  return (
    <div className="page">
      <section className="page-hero">
        <span className="badge">Partida</span>
        <h1>
          {m.playerA.nickname} <span className="muted">vs</span> {m.playerB.nickname}
        </h1>
        <p className="muted">
          {m.roundLabel}
          {t ? ` · ${t.name}` : ""}
        </p>
      </section>

      <div className="timer-banner" style={{ marginBottom: 20 }}>
        <div>
          <strong>Pré-partida (exemplo)</strong>
          <div className="muted" style={{ fontSize: "0.92rem" }}>
            Ao solicitar início, abre janela de 20 min; adversário pode pedir +15 min uma vez ou
            confirmar que começou.
          </div>
        </div>
        <button type="button" className="btn btn-secondary">
          Solicitar início
        </button>
      </div>

      <div className="split">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Placar enviado</h2>
          <p style={{ fontSize: "1.75rem", fontWeight: 800 }}>{m.scoreLabel ?? "—"}</p>
          <p className="muted">
            Fluxo: um lado envia resultado + print opcional; o outro confirma. Sem resposta no
            prazo → confirmação automática (ex.: 10 min).
          </p>
          {m.confirmMinutesLeft != null && (
            <p>
              <span className="status warn">Confirmação do adversário · ~{m.confirmMinutesLeft} min</span>
            </p>
          )}
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Ações</h2>
          <div className="stack">
            <button type="button" className="btn btn-primary">
              Confirmar resultado
            </button>
            <button type="button" className="btn btn-secondary">
              Contestar (com print)
            </button>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Pós-WO: 15 min para pedido de reversão; reverte só com &quot;Aceitar reversão&quot; do
              adversário no sistema; sem acordo → organização.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Prova (imagem)</h2>
        <p className="muted">
          Upload para Storage (Supabase) na próxima etapa. Aqui apenas o espaço da UI.
        </p>
        <button type="button" className="btn btn-ghost">
          Anexar screenshot
        </button>
      </div>

      <div className="inline-actions" style={{ marginTop: 24 }}>
        <Link href={t ? `/campeonatos/${t.id}` : "/campeonatos"} className="btn btn-secondary">
          Voltar ao campeonato
        </Link>
      </div>
    </div>
  );
}
