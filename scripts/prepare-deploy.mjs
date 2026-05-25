#!/usr/bin/env node
// Remove rotas de preview que não podem ir pra produção.
// Uso: node scripts/prepare-deploy.mjs [--dry-run]

import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TARGETS = [
  "app/admin/jogos-preview",
  "app/api/admin/games-preview",
  "app/api/admin/interest-preview",
  "app/api/admin/tournaments-preview",
  "app/api/admin/player-badges-preview"
];

const dryRun = process.argv.includes("--dry-run");

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

let removed = 0;
let missing = 0;

for (const rel of TARGETS) {
  const abs = path.join(ROOT, rel);
  if (!(await exists(abs))) {
    missing++;
    console.log(`  skip   ${rel} (já não existe)`);
    continue;
  }
  if (dryRun) {
    console.log(`  would  ${rel}`);
  } else {
    await rm(abs, { recursive: true, force: true });
    console.log(`  remove ${rel}`);
  }
  removed++;
}

console.log("");
console.log(
  dryRun
    ? `Dry-run: ${removed} pasta(s) seriam removidas, ${missing} já estavam ausentes.`
    : `Pronto: ${removed} pasta(s) removidas, ${missing} já estavam ausentes.`
);
console.log("Lembrete: rode 'npm run build' depois pra garantir que nada quebrou.");
