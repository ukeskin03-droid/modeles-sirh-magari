/**
 * RÉGLAGES DE L'INSTALLATION
 *
 * Une installation = le code (identique partout) + un dossier de données + quelques
 * réglages. Ce fichier est le seul endroit qui sait où se trouve le dossier de données
 * et comment lire les réglages (variables d'environnement, voir .env.example).
 *
 * Il ne dépend d'aucun autre fichier du projet : il est aussi utilisé par les outils
 * en ligne de commande (prisma.config.ts, scripts/).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Dossier de données de la communauté (chemin absolu). */
export function dataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  return path.resolve(/*turbopackIgnore: true*/ configured || "donnees/defaut");
}

/** Crée le dossier de données (et un sous-dossier éventuel) s'il n'existe pas encore. */
export function ensureDataDir(...subfolders: string[]): string {
  const dir = path.join(/*turbopackIgnore: true*/ dataDir(), ...subfolders);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Fichier de la base SQLite de la communauté. */
export function databaseFile(): string {
  return path.join(/*turbopackIgnore: true*/ dataDir(), "base.db");
}

/** Adresse de la base au format attendu par Prisma. */
export function databaseUrl(): string {
  return `file:${databaseFile()}`;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Code demandé pour créer le premier compte administrateur (null s'il n'est pas défini). */
export function setupCode(): string | null {
  return process.env.SETUP_CODE?.trim() || null;
}

/** Adresse publique de l'installation, sans barre finale (null si elle n'est pas définie). */
export function configuredAppUrl(): string | null {
  const url = process.env.APP_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

let cachedSecret: string | null = null;

/**
 * Secret de l'application. Il sert à calculer les pseudonymes du journal d'activité.
 * Ordre de recherche : la variable APP_SECRET, sinon le fichier « secret » du dossier
 * de données (créé automatiquement au premier besoin).
 */
export function appSecret(): string {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.APP_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  const file = path.join(ensureDataDir(), "secret");
  if (!fs.existsSync(file)) {
    // « wx » : n'écrit que si le fichier n'existe pas ; 0o600 : lisible par le seul propriétaire.
    try {
      fs.writeFileSync(file, crypto.randomBytes(48).toString("base64url"), { flag: "wx", mode: 0o600 });
    } catch {
      // Un autre processus vient de le créer : on lit simplement le sien.
    }
  }
  cachedSecret = fs.readFileSync(file, "utf8").trim();
  return cachedSecret;
}
