import type { Structure, Match, KnockoutRound, Group, Seed } from "@/lib/mock-structure";

function ParticipantName({ seed }: { seed: Seed }) {
  const content = (
    <span className={`participant-name ${seed.isLive ? "participant-name-live" : ""}`}>
      <span className="participant-name-copy">
        <span>{seed.label}</span>
        {seed.sublabel ? <small>{seed.sublabel}</small> : null}
      </span>
      {seed.isLive ? <span className="participant-live-badge">Ao vivo</span> : null}
    </span>
  );

  if (seed.isLive && seed.twitchUrl) {
    return (
      <a className="participant-link" href={seed.twitchUrl} rel="noreferrer" target="_blank" title={`Assistir ${seed.label} na Twitch`}>
        {content}
      </a>
    );
  }

  return content;
}

function Team({ seed }: { seed: Seed }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          borderRadius: 99,
          background: "rgba(255, 59, 212, 0.75)",
          boxShadow: "0 0 0 3px rgba(255, 59, 212, 0.15)"
        }}
      />
      <ParticipantName seed={seed} />
    </span>
  );
}

function MatchCard({ m }: { m: Match }) {
  return (
    <div className="match-card">
      <div className="match-row">
        <div className="match-team">{m.a ? <Team seed={m.a} /> : <span className="muted">A definir</span>}</div>
        <div className="match-score">{m.scoreA ?? "-"}</div>
      </div>
      <div className="match-row">
        <div className="match-team">{m.b ? <Team seed={m.b} /> : <span className="muted">A definir</span>}</div>
        <div className="match-score">{m.scoreB ?? "-"}</div>
      </div>
      <div className="match-meta">
        <span className={`status ${m.status === "finalizada" ? "ok" : m.status === "ao_vivo" ? "warn" : ""}`}>
          {m.status === "finalizada" ? "Finalizada" : m.status === "ao_vivo" ? "Ao vivo" : "Pendente"}
        </span>
      </div>
    </div>
  );
}

function Knockout({ rounds }: { rounds: KnockoutRound[] }) {
  return (
    <div className="bracket-wrap">
      <div className="bracket">
        {rounds.map((r) => (
          <div key={r.name} className="round">
            <div className="round-title">{r.name}</div>
            <div className="round-matches">
              {r.matches.map((m) => (
                <MatchCard key={m.id} m={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupTable({ g }: { g: Group }) {
  return (
    <div className="card soft" style={{ padding: 16 }}>
      <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <strong>{g.name}</strong>
        <span className="muted" style={{ fontSize: "0.9rem" }}>
          Classificam 2
        </span>
      </div>
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Pts</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
            </tr>
          </thead>
          <tbody>
            {g.teams.map((t) => (
              <tr key={t.seed.id}>
                <td>
                  <ParticipantName seed={t.seed} />
                </td>
                <td>{t.pts}</td>
                <td>{t.w}</td>
                <td>{t.d}</td>
                <td>{t.l}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PointsTable({ rows }: { rows: Group["teams"] }) {
  return (
    <div className="card soft" style={{ padding: 16 }}>
      <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <strong>Tabela</strong>
        <span className="muted" style={{ fontSize: "0.9rem" }}>
          Pontos corridos
        </span>
      </div>
      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Pts</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, idx) => (
              <tr key={t.seed.id}>
                <td>{idx + 1}</td>
                <td>
                  <ParticipantName seed={t.seed} />
                </td>
                <td>{t.pts}</td>
                <td>{t.w}</td>
                <td>{t.d}</td>
                <td>{t.l}</td>
                <td>{t.gf}</td>
                <td>{t.ga}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TournamentStructure({ data }: { data: Structure }) {
  if (data.format === "eliminacao") {
    return (
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          Chaveamento mata-mata: avanca quem vence, com desempate seguindo as regras do torneio.
        </p>
        <Knockout rounds={data.rounds} />
      </div>
    );
  }

  if (data.format === "grupos") {
    return (
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          Fase de grupos mais mata-mata: os melhores de cada grupo avancam para a eliminatoria.
        </p>
        <div className="grid cols-2">
          {data.groups.map((g) => (
            <GroupTable key={g.name} g={g} />
          ))}
        </div>
        <Knockout rounds={data.knockout} />
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Pontos corridos: ranking por pontuacao, com criterios de desempate definidos pelo campeonato.
      </p>
      <PointsTable rows={data.table} />
    </div>
  );
}
