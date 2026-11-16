/**
 * Exécuté une fois avant tous les tests : prépare une base vide et à jour, en
 * appliquant les migrations exactement comme au démarrage d'une vraie installation.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { TEMPLATE_DIR, TEST_ROOT } from "./paths";

export default function setup() {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: { ...process.env, DATA_DIR: TEMPLATE_DIR },
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`Impossible de préparer la base de test :\n${result.stdout}\n${result.stderr}`);

  return () => fs.rmSync(TEST_ROOT, { recursive: true, force: true });
}
