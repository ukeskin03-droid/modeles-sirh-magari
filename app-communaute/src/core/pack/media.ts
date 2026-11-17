/**
 * Médias dans un pack : le dossier media/ et son index media/index.json.
 *
 *   media/index.json : [{ "file": "a1b2.png", "filename": "hall.png", "alt": "Le hall", "public": false }]
 *
 * Le nom de fichier dans media/ est la « clé » du média : c'est elle que les contenus
 * utilisent (/media/a1b2.png), et elle est conservée à l'import.
 */
import { db } from "@/core/db/client";
import { ALLOWED_MEDIA_TYPES, MediaError, saveMedia } from "@/core/media/service";
import { mediaStorage } from "@/core/media/storage";

export const MEDIA_FOLDER = "media";
const INDEX_FILE = `${MEDIA_FOLDER}/index.json`;

type IndexEntry = { file: string; filename?: string; alt?: string; public?: boolean };

export type MediaImportReport = { created: number; updated: number; unchanged: number; warnings: string[]; idByPath: Map<string, string> };

/** Importe tous les fichiers du dossier media/. « publicPaths » : ceux qui doivent être visibles sans connexion. */
export async function importPackMedia(files: ReadonlyMap<string, Buffer>, publicPaths: ReadonlySet<string>): Promise<MediaImportReport> {
  const report: MediaImportReport = { created: 0, updated: 0, unchanged: 0, warnings: [], idByPath: new Map() };
  let index: IndexEntry[] = [];
  const rawIndex = files.get(INDEX_FILE);
  if (rawIndex) {
    try {
      const parsed: unknown = JSON.parse(rawIndex.toString("utf8"));
      if (Array.isArray(parsed)) index = parsed as IndexEntry[];
    } catch {
      report.warnings.push(`${INDEX_FILE} : fichier illisible, les textes alternatifs des images ne sont pas repris.`);
    }
  }
  const info = new Map(index.map((entry) => [`${MEDIA_FOLDER}/${entry.file}`, entry]));

  for (const [path, data] of files) {
    if (!path.startsWith(`${MEDIA_FOLDER}/`) || path === INDEX_FILE) continue;
    const key = path.slice(MEDIA_FOLDER.length + 1);
    const entry = info.get(path);
    try {
      const saved = await saveMedia({ filename: entry?.filename ?? key, data, alt: entry?.alt, isPublic: publicPaths.has(path) || entry?.public === true, key });
      report[saved.outcome]++;
      report.idByPath.set(path, saved.id);
    } catch (error) {
      if (!(error instanceof MediaError)) throw error;
      report.warnings.push(
        error.reason === "too-large" ? `${path} : image trop volumineuse (5 Mo au maximum), ignorée.` : `${path} : type de fichier non accepté (${Object.keys(ALLOWED_MEDIA_TYPES).join(", ")}), ignoré.`,
      );
    }
  }
  return report;
}

/** Exporte des médias (tous, ou seulement ceux dont l'identifiant est donné). */
export async function exportPackMedia(onlyIds?: readonly string[]): Promise<Map<string, string | Buffer>> {
  const files = new Map<string, string | Buffer>();
  const medias = await db().media.findMany({ where: onlyIds ? { id: { in: [...onlyIds] } } : undefined, orderBy: { storageKey: "asc" } });
  const index: IndexEntry[] = [];
  for (const media of medias) {
    const data = await mediaStorage().get(media.storageKey);
    if (!data) continue;
    files.set(`${MEDIA_FOLDER}/${media.storageKey}`, data);
    index.push({ file: media.storageKey, filename: media.filename, alt: media.alt, public: media.isPublic });
  }
  if (index.length > 0) files.set(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`);
  return files;
}
