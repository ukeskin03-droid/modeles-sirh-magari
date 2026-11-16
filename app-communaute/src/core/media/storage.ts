/**
 * STOCKAGE DES FICHIERS
 *
 * Le reste du code ne sait pas OÙ sont rangés les fichiers : il utilise seulement
 * les trois opérations ci-dessous. Aujourd'hui, les fichiers sont dans le dossier
 * « medias » du dossier de données. Pour passer à un stockage objet (type S3), il
 * suffira d'écrire une seconde implémentation de « MediaStorage » et de la renvoyer
 * dans mediaStorage().
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ensureDataDir } from "@/core/config/installation";

export type MediaStorage = {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
};

/** N'accepte que des noms de fichier simples : impossible de sortir du dossier de stockage. */
function safeKey(key: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(key)) throw new Error(`Nom de fichier refusé : ${key}`);
  return key;
}

const localStorage: MediaStorage = {
  async put(key, data) {
    await fs.writeFile(path.join(ensureDataDir("medias"), safeKey(key)), data);
  },
  async get(key) {
    try {
      return await fs.readFile(path.join(ensureDataDir("medias"), safeKey(key)));
    } catch {
      return null;
    }
  },
  async delete(key) {
    await fs.rm(path.join(ensureDataDir("medias"), safeKey(key)), { force: true });
  },
};

export function mediaStorage(): MediaStorage {
  return localStorage;
}
