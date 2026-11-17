/**
 * Lecture et écriture d'un pack au format .zip.
 */
import { unzipSync, zipSync } from "fflate";
import { PackError, parsePackManifest, type Pack } from "./schema";

/** Garde-fous contre un fichier .zip malveillant ou démesuré. */
const MAX_FILES = 5000;
const MAX_TOTAL_BYTES = 300 * 1024 * 1024;
export const PACK_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Chemin acceptable dans un pack : relatif, sans « .. », sans caractère exotique. */
function isSafePath(path: string): boolean {
  return !path.startsWith("/") && !path.includes("\\") && !path.split("/").some((part) => part === ".." || part === "." || part === "") && path.length < 300;
}

export function readPackZip(data: Uint8Array): Pack {
  let entries: Record<string, Uint8Array>;
  let total = 0;
  let count = 0;
  try {
    entries = unzipSync(data, {
      filter: (file) => {
        if (file.name.endsWith("/")) return false; // dossier
        total += file.originalSize;
        count++;
        if (count > MAX_FILES || total > MAX_TOTAL_BYTES) throw new PackError(["Ce fichier .zip est trop volumineux pour être un pack."]);
        return isSafePath(file.name);
      },
    });
  } catch (error) {
    if (error instanceof PackError) throw error;
    throw new PackError(["Ce fichier n'est pas un .zip lisible."]);
  }

  let names = Object.keys(entries);
  // Tolérance : si tout le pack est rangé dans un dossier unique (zip fait à la main), on l'ouvre.
  if (!names.includes("pack.json")) {
    const roots = new Set(names.map((name) => name.split("/")[0]));
    const [root] = [...roots];
    if (roots.size === 1 && names.includes(`${root}/pack.json`)) {
      entries = Object.fromEntries(names.map((name) => [name.slice(root.length + 1), entries[name]]));
      names = Object.keys(entries);
    }
  }
  if (!names.includes("pack.json")) throw new PackError(["Ce .zip ne contient pas de fichier pack.json : ce n'est pas un pack."]);

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(entries["pack.json"]).toString("utf8"));
  } catch (error) {
    throw new PackError([`pack.json n'est pas un fichier JSON valide (${error instanceof Error ? error.message : "erreur de lecture"}).`]);
  }
  const files = new Map<string, Buffer>();
  for (const name of names) if (name !== "pack.json") files.set(name, Buffer.from(entries[name]));
  return { manifest: parsePackManifest(json), files };
}

export function writeZip(files: ReadonlyMap<string, string | Buffer | Uint8Array>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [path, content] of [...files.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    entries[path] = typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);
  }
  // Date fixe : deux exports d'un même contenu donnent deux fichiers identiques.
  return zipSync(entries, { level: 6, mtime: new Date("2026-01-01T00:00:00Z") });
}
