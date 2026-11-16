/**
 * Lit un pack rangé dans un dossier (c'est le cas des packs d'exemple de seed/packs/).
 * La lecture d'un pack .zip téléversé depuis l'interface arrivera en phase 6 : elle
 * produira le même objet « Pack », et tout le reste du code sera partagé.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PackError, parsePackManifest, type Pack } from "./schema";

async function listFiles(root: string, folder = ""): Promise<string[]> {
  const entries = await fs.readdir(path.join(root, folder), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = folder ? `${folder}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(root, relative)));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

export async function readPackDirectory(directory: string): Promise<Pack> {
  let rawManifest: string;
  try {
    rawManifest = await fs.readFile(path.join(directory, "pack.json"), "utf8");
  } catch {
    throw new PackError([`Le dossier ${directory} ne contient pas de fichier pack.json.`]);
  }

  let json: unknown;
  try {
    json = JSON.parse(rawManifest);
  } catch (error) {
    throw new PackError([`pack.json n'est pas un fichier JSON valide (${error instanceof Error ? error.message : "erreur de lecture"}).`]);
  }

  const files = new Map<string, Buffer>();
  for (const file of await listFiles(directory)) {
    if (file !== "pack.json") files.set(file, await fs.readFile(path.join(directory, file)));
  }
  return { manifest: parsePackManifest(json), files };
}
