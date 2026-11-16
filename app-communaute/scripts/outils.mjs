/**
 * Fonctions communes aux scripts de lancement. Elles appellent directement les
 * programmes installés dans node_modules, ce qui fonctionne à l'identique sous
 * Windows, macOS et Linux.
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const programmes = {
  prisma: "node_modules/prisma/build/index.js",
  next: "node_modules/next/dist/bin/next",
  tsx: "node_modules/tsx/dist/cli.mjs",
};

/** Lit le fichier .env s'il existe (les scripts ne le lisent pas tout seuls). */
export function chargerEnv() {
  try {
    process.loadEnvFile(path.join(racine, ".env"));
  } catch {
    // Pas de fichier .env : les valeurs par défaut s'appliquent.
  }
}

/** Dossier de données d'une communauté désignée par son nom. */
export function dossierDe(communaute) {
  return path.join("donnees", communaute);
}

/** Exécute un programme et attend la fin. Arrête tout en cas d'échec. */
export function executer(programme, args, env = {}) {
  const resultat = spawnSync(process.execPath, [path.join(racine, programmes[programme]), ...args], {
    cwd: racine,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (resultat.status !== 0) process.exit(resultat.status ?? 1);
}

/** Lance un programme qui reste en fonctionnement (le serveur). */
export function lancer(programme, args, env = {}) {
  return spawn(process.execPath, [path.join(racine, programmes[programme]), ...args], {
    cwd: racine,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

/** Met la base à niveau : applique les évolutions de structure pas encore appliquées. */
export function mettreBaseANiveau(env = {}) {
  executer("prisma", ["migrate", "deploy"], env);
}
