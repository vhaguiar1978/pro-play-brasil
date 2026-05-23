"use client";

import { useEffect, useState } from "react";
import { readUserRegistry, type UserRegistryEntry } from "@/lib/user-registry";

type AdminUserRecord = {
  id: string;
  full_name: string;
  gamertag: string;
  status: "active" | "penalized" | "banned";
};

export function AdminUsersOverview() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        const payload = (await response.json()) as { ok?: boolean; users?: AdminUserRecord[] };

        if (!mounted) return;
        if (response.ok && payload.ok && Array.isArray(payload.users)) {
          setUsers(payload.users);
          return;
        }
      } catch {
        // fallback local logo abaixo
      }

      if (!mounted) return;
      const localUsers = readUserRegistry().map((user: UserRegistryEntry) => ({
        id: user.id,
        full_name: user.fullName,
        gamertag: user.gamertag,
        status: user.status
      }));
      setUsers(localUsers);
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="stack" style={{ marginTop: 24 }}>
      <div className="grid cols-2">
        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Contagem de usuarios</h2>
          <p style={{ fontSize: "2.35rem", fontWeight: 900, margin: "8px 0 0" }}>{users.length}</p>
          <p className="muted">Resumo rapido para voce acompanhar o crescimento do sistema.</p>
        </div>

        <div className="card soft">
          <h2 style={{ marginTop: 0 }}>Lista rapida</h2>
          <p className="muted">Nome completo e gamertag dos usuarios cadastrados no sistema.</p>
        </div>
      </div>

      <div className="card soft">
        <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
          <h2 style={{ margin: 0 }}>Usuarios no sistema</h2>
          <span className="badge official">{users.length} cadastrados</span>
        </div>

        {users.length === 0 ? (
          <p className="muted" style={{ marginTop: 16 }}>
            Ainda nao ha usuarios registrados neste navegador.
          </p>
        ) : (
          <div className="stack" style={{ marginTop: 16 }}>
            {users.map((user, index) => (
              <div key={user.id} className="participant-card">
                <div>
                  <strong>{index + 1}. {user.full_name}</strong>
                  <div className="muted" style={{ fontSize: "0.92rem" }}>{user.gamertag}</div>
                </div>
                <span className="badge">{user.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
