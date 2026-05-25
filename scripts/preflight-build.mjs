#!/usr/bin/env node
// Detecta `next dev` rodando em localhost:3000 antes de `next build`.
// Rodar build com dev no ar corrompe o .next/ compartilhado e quebra
// ambos. Esse guard avisa e aborta. Use `PPB_BUILD_FORCE=1 npm run build`
// pra ignorar (ex: CI, ou se você sabe o que está fazendo).

import { request } from "node:http";

const FORCE = process.env.PPB_BUILD_FORCE === "1";
const isCI = process.env.CI === "true" || process.env.VERCEL === "1";

if (FORCE || isCI) {
  process.exit(0);
}

function probe() {
  return new Promise((resolve) => {
    const req = request(
      { host: "127.0.0.1", port: 3000, path: "/", method: "HEAD", timeout: 800 },
      (res) => {
        res.resume();
        resolve(true);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

const running = await probe();
if (!running) process.exit(0);

console.error("");
console.error("\x1b[31m\x1b[1m  ✖  ABORTANDO BUILD\x1b[0m");
console.error("\x1b[33m  Detectei um servidor escutando em localhost:3000.\x1b[0m");
console.error("\x1b[33m  Rodar `next build` em paralelo com `next dev` corrompe o .next/\x1b[0m");
console.error("\x1b[33m  compartilhado e ambos param de responder.\x1b[0m");
console.error("");
console.error("  O que fazer:");
console.error("    1. Pare o `npm run dev` (Ctrl+C no terminal dele).");
console.error("    2. Rode `npm run build` de novo.");
console.error("    3. Quando terminar, suba o dev de volta com `npm run dev`.");
console.error("");
console.error("  Pra forçar mesmo assim (CI já ignora automaticamente):");
console.error("    \x1b[36mPPB_BUILD_FORCE=1 npm run build\x1b[0m");
console.error("");
process.exit(1);
