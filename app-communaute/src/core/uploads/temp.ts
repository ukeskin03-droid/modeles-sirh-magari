/**
 * FICHIERS EN ATTENTE
 *
 * Un import se fait en deux temps : on envoie le fichier, l'application montre ce qu'elle
 * va en faire, puis on confirme. Entre les deux, le fichier est gardé ici, dans le dossier
 * « tmp » du dossier de données, sous un nom aléatoire (le « jeton »). Il est supprimé dès
 * la confirmation ou l'annulation, et de toute façon au bout de deux heures.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { unzipSync } from "fflate";
import { ensureDataDir } from "@/core/config/installation";
import { writeZip } from "@/core/pack/zip";

const TOKEN_PATTERN = /^[a-f0-9]{32}$/;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const fileOf = (token: string) => path.join(ensureDataDir("tmp"), token);

export async function saveTempFile(data: Uint8Array): Promise<string> {
  const token = crypto.randomBytes(16).toString("hex");
  await fs.writeFile(fileOf(token), data);
  return token;
}

export async function readTempFile(token: string): Promise<Buffer | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  try {
    return await fs.readFile(fileOf(token));
  } catch {
    return null;
  }
}

export async function deleteTempFile(token: string): Promise<void> {
  if (TOKEN_PATTERN.test(token)) await fs.rm(fileOf(token), { force: true });
}

/** Plusieurs fichiers envoyés ensemble sont gardés dans une seule archive. */
export async function saveTempFiles(files: { name: string; data: Uint8Array }[]): Promise<string> {
  return saveTempFile(writeZip(new Map(files.map((file, index) => [`${index}/${path.basename(file.name)}`, file.data]))));
}

export async function readTempFiles(token: string): Promise<{ name: string; data: Buffer }[] | null> {
  const archive = await readTempFile(token);
  if (!archive) return null;
  return Object.entries(unzipSync(archive))
    .map(([entry, data]) => ({ order: Number(entry.split("/")[0]), name: entry.slice(entry.indexOf("/") + 1), data: Buffer.from(data) }))
    .sort((a, b) => a.order - b.order)
    .map(({ name, data }) => ({ name, data }));
}

/** Ménage périodique (tâche planifiée). */
export async function cleanupTempFiles(now = Date.now()): Promise<void> {
  const folder = ensureDataDir("tmp");
  for (const name of await fs.readdir(folder)) {
    const stats = await fs.stat(path.join(folder, name)).catch(() => null);
    if (stats && now - stats.mtimeMs > MAX_AGE_MS) await fs.rm(path.join(folder, name), { force: true });
  }
}

/** Lit les fichiers d'un champ de formulaire (en ignorant les champs vides). */
export async function filesFromForm(data: FormData, field: string): Promise<{ name: string; data: Buffer }[]> {
  const result: { name: string; data: Buffer }[] = [];
  for (const value of data.getAll(field)) {
    if (value instanceof File && value.size > 0) result.push({ name: value.name, data: Buffer.from(await value.arrayBuffer()) });
  }
  return result;
}
