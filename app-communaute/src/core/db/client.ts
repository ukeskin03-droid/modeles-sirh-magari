/**
 * CONNEXION À LA BASE DE DONNÉES
 *
 * Tout le code passe par la fonction db() pour lire ou écrire en base.
 * La connexion est ouverte au premier appel puis réutilisée.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { databaseUrl, ensureDataDir } from "@/core/config/installation";

// En développement, Next.js recharge le code à chaud : on garde la connexion dans
// une variable globale pour ne pas en ouvrir une nouvelle à chaque rechargement.
const globalStore = globalThis as { __communityDb?: { url: string; client: PrismaClient } };

export function db(): PrismaClient {
  const url = databaseUrl();
  const existing = globalStore.__communityDb;
  if (existing && existing.url === url) return existing.client;

  ensureDataDir();
  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  globalStore.__communityDb = { url, client };
  return client;
}

/** Type d'une valeur JSON acceptée par la base (utile pour les colonnes de configuration). */
export type JsonValue = Prisma.InputJsonValue;
