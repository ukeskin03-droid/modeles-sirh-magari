/**
 * CONNEXION À LA BASE DE DONNÉES
 *
 * Tout le code passe par la fonction db() pour lire ou écrire en base.
 * La connexion est ouverte au premier appel puis réutilisée.
 *
 * TRANSACTIONS — inTransaction(...) regroupe plusieurs écritures en un « tout ou rien » :
 * si une étape échoue, rien n'est enregistré. Pendant une transaction, db() renvoie
 * automatiquement la connexion de cette transaction : le code appelé n'a rien à changer.
 * Avec l'option « dryRun », tout est annulé à la fin : cela sert à prévisualiser un
 * import (« voici ce qui serait créé ») sans rien modifier.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { databaseUrl, ensureDataDir } from "@/core/config/installation";

// En développement, Next.js recharge le code à chaud : on garde la connexion dans
// une variable globale pour ne pas en ouvrir une nouvelle à chaque rechargement.
type TransactionState = { client: Prisma.TransactionClient; dryRun: boolean };

const globalStore = globalThis as {
  __communityDb?: { url: string; client: PrismaClient };
  __communityTx?: AsyncLocalStorage<TransactionState>;
};

const currentTransaction = (globalStore.__communityTx ??= new AsyncLocalStorage<TransactionState>());

function rootClient(): PrismaClient {
  const url = databaseUrl();
  const existing = globalStore.__communityDb;
  if (existing && existing.url === url) return existing.client;

  ensureDataDir();
  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  globalStore.__communityDb = { url, client };
  return client;
}

export function db(): Prisma.TransactionClient {
  return currentTransaction.getStore()?.client ?? rootClient();
}

/**
 * Vrai pendant une simulation (transaction « dryRun »). Les opérations qui ne passent pas
 * par la base (écrire ou supprimer un fichier) doivent alors ne rien faire.
 */
export function isDryRun(): boolean {
  return currentTransaction.getStore()?.dryRun ?? false;
}

class DryRunRollback extends Error {}

export async function inTransaction<T>(work: () => Promise<T>, options: { dryRun?: boolean } = {}): Promise<T> {
  // Déjà dans une transaction : on s'y joint simplement.
  if (currentTransaction.getStore()) return work();

  let result: T | undefined;
  try {
    await rootClient().$transaction(
      async (transaction) => {
        result = await currentTransaction.run({ client: transaction, dryRun: options.dryRun ?? false }, work);
        if (options.dryRun) throw new DryRunRollback();
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;
  }
  return result as T;
}

/** Type d'une valeur JSON acceptée par la base (utile pour les colonnes de configuration). */
export type JsonValue = Prisma.InputJsonValue;
