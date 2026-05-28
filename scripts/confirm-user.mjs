// scripts/confirm-user.mjs
//
// Confirma o email de um user (e opcionalmente reseta a senha) usando service_role.
// Uso:
//   node scripts/confirm-user.mjs <email>
//   node scripts/confirm-user.mjs <email> <senha-nova>
//
// Carrega .env.local automaticamente.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
} catch (err) {
  console.error("Falha ao ler .env.local:", err.message);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = process.argv[2];
const newPassword = process.argv[3]; // opcional
if (!email) {
  console.error("Uso: node scripts/confirm-user.mjs <email> [senha-nova]");
  process.exit(1);
}

const supa = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 1) acha o user pelo email
const { data: list, error: listErr } = await supa.auth.admin.listUsers({
  page: 1,
  perPage: 200
});
if (listErr) {
  console.error("Erro listando users:", listErr.message);
  process.exit(1);
}

let target = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

// Se não existe e veio senha, cria o user já confirmado
if (!target) {
  if (!newPassword) {
    console.error(`Nenhum user com email "${email}" encontrado.`);
    console.log("Emails cadastrados:");
    for (const u of list.users) console.log("-", u.email, "| confirmado:", !!u.email_confirmed_at);
    console.log(`\nPra CRIAR esse user agora, rode com senha: node scripts/confirm-user.mjs ${email} <senha>`);
    process.exit(1);
  }
  console.log(`User "${email}" não existe — criando agora (já confirmado)...`);
  const gamertagFromEmail = email.split("@")[0];
  const { data: created, error: createErr } = await supa.auth.admin.createUser({
    email,
    password: newPassword,
    email_confirm: true,
    user_metadata: { gamertag: gamertagFromEmail }
  });
  if (createErr) {
    console.error("Erro criando user:", createErr.message);
    process.exit(1);
  }
  console.log(`✅ User criado: ${created.user.email} (id=${created.user.id})`);
  console.log(`  Gamertag: ${gamertagFromEmail}`);
  console.log(`\nLoga em: https://pro-play-brasil-app.vercel.app/entrar`);
  console.log(`  Email: ${email}`);
  console.log(`  Senha: ${newPassword}`);
  process.exit(0);
}

console.log(`Encontrado: ${target.email} (id=${target.id})`);
console.log(`  Confirmado antes? ${!!target.email_confirmed_at}`);
console.log(`  Gamertag: ${target.user_metadata?.gamertag ?? "(não definido)"}`);

// 2) confirma email + opcional: troca senha
const updatePayload = { email_confirm: true };
if (newPassword) updatePayload.password = newPassword;

const { data: updated, error: updateErr } = await supa.auth.admin.updateUserById(
  target.id,
  updatePayload
);
if (updateErr) {
  console.error("Erro atualizando user:", updateErr.message);
  process.exit(1);
}

console.log("\n✅ Pronto!");
console.log(`  Email confirmado: ${!!updated.user.email_confirmed_at}`);
if (newPassword) console.log("  Senha foi redefinida.");
console.log(`\nLoga em: https://pro-play-brasil-app.vercel.app/entrar`);
console.log(`  Email: ${updated.user.email}`);
if (newPassword) console.log(`  Senha: ${newPassword}`);
