import { createClient } from "@/lib/supabase/server";

type RankingRow = {
  pos: number;
  nick: string;
  city: string;
  uf: string;
  joinedAt: string;
};

async function getRankingRows(): Promise<RankingRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("gamertag,city,state,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error || !Array.isArray(data)) return [];

    return data.map((profile, idx) => ({
      pos: idx + 1,
      nick: profile.gamertag as string,
      city: (profile.city as string) || "–",
      uf: (profile.state as string) || "–",
      joinedAt: profile.created_at as string
    }));
  } catch {
    return [];
  }
}

export default async function RankingPage() {
  const rows = await getRankingRows();

  return (
    <div className="page">
      <section className="page-hero">
        <span className="badge official">Comunidade</span>
        <h1>Ranking</h1>
        <p className="muted">
          Jogadores cadastrados na plataforma ordenados por data de entrada. O ranking por pontos e vitorias sera
          ativado quando as partidas passarem a ser registradas no banco.
        </p>
      </section>

      <div className="card">
        <div className="inline-actions" style={{ marginBottom: 16 }}>
          <span className="tab active">Nacional</span>
        </div>

        {rows.length === 0 ? (
          <p className="muted">Nenhum jogador cadastrado ainda ou banco ainda nao conectado.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nickname</th>
                  <th>Local</th>
                  <th>Membro desde</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.nick}>
                    <td>{r.pos}</td>
                    <td>{r.nick}</td>
                    <td>
                      {r.city !== "–" || r.uf !== "–" ? `${r.city} • ${r.uf}` : "–"}
                    </td>
                    <td>{new Date(r.joinedAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
