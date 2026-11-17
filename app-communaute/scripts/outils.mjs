/**
 * Fonctions communes aux scripts de lancement. Elles appellent directement les
 * programmes installés dans node_modules, ce qui fonctionne à l'identique sous
 * Windows, macOS et Linux.
 */
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
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

/**
 * Adresse publique quand l'application tourne dans GitHub Codespaces. Le navigateur y
 * passe par une adresse du type https://<nom-du-codespace>-3001.app.github.dev, que le
 * serveur ne peut pas deviner seul : sans elle, la connexion est refusée et les liens
 * de partage pointeraient vers « localhost ». Hors Codespaces : rien (null).
 */
function adresseCodespaces(port) {
  const nom = process.env.CODESPACE_NAME;
  const domaine = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
  return nom ? `https://${nom}-${port}.${domaine}` : null;
}

/** Lance un programme qui reste en fonctionnement (le serveur). */
export function lancer(programme, args, env = {}) {
  const complet = { ...process.env, ...env };
  if (programme === "next" && !complet.APP_URL) {
    const adresse = adresseCodespaces(complet.PORT || "3000");
    if (adresse) complet.APP_URL = adresse;
  }
  return spawn(process.execPath, [path.join(racine, programmes[programme]), ...args], {
    cwd: racine,
    stdio: "inherit",
    env: complet,
  });
}

/** Met la base à niveau : applique les évolutions de structure pas encore appliquées. */
export function mettreBaseANiveau(env = {}) {
  executer("prisma", ["migrate", "deploy"], env);
}

/**
 * Vérifie qu'aucun autre programme n'utilise déjà le port. Sinon, le nouveau serveur
 * ne pourrait pas démarrer et l'ANCIENNE version continuerait de répondre, sans que
 * rien ne le signale clairement. On s'arrête donc avec une explication.
 */
export async function exigerPortLibre(port) {
  const libre = await new Promise((resolve) => {
    const essai = net.createServer();
    essai.once("error", () => resolve(false));
    essai.once("listening", () => essai.close(() => resolve(true)));
    essai.listen(Number(port));
  });
  if (libre) return;
  console.error(
    `\n  ✖ Le port ${port} est déjà utilisé : l'application tourne sans doute déjà dans un autre terminal.\n` +
      `    Arrêtez-la d'abord (Ctrl+C dans ce terminal, ou fermez-le avec l'icône corbeille),\n` +
      `    puis relancez cette commande.\n`,
  );
  process.exit(1);
}
