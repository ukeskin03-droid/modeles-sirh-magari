/**
 * Fichiers Markdown « avec en-tête », utilisés dans les packs et les imports :
 *
 *   ---
 *   title: Titre du contenu
 *   category: parent/enfant
 *   ---
 *   Le texte, en Markdown…
 *
 * L'en-tête (entre les deux lignes « --- ») est au format YAML : « clé: valeur ».
 */
import { parse, stringify } from "yaml";

export type FrontMatter = { data: Record<string, unknown>; body: string; error?: string };

export function parseFrontMatter(text: string): FrontMatter {
  const clean = text.replace(/^﻿/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(clean);
  if (!match) return { data: {}, body: clean.trim() };
  try {
    const data: unknown = parse(match[1]);
    return { data: data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {}, body: match[2].trim() };
  } catch (error) {
    return { data: {}, body: match[2].trim(), error: error instanceof Error ? error.message.split("\n")[0] : "en-tête illisible" };
  }
}

/** Fabrique le fichier. Les valeurs vides (undefined, null, "", liste vide) sont omises. */
export function stringifyFrontMatter(data: Record<string, unknown>, body: string): string {
  const kept = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)));
  return `---\n${stringify(kept, { lineWidth: 0 })}---\n\n${body.trim()}\n`;
}

/** Les fichiers .md d'un dossier du pack : [identifiant (nom sans extension), contenu]. */
export function markdownFilesIn(files: ReadonlyMap<string, Buffer>, folder: string): [string, string][] {
  const prefix = `${folder}/`;
  return [...files.entries()]
    .filter(([path]) => path.startsWith(prefix) && path.endsWith(".md") && !path.slice(prefix.length).includes("/"))
    .map(([path, content]): [string, string] => [path.slice(prefix.length, -3), content.toString("utf8")])
    .sort(([a], [b]) => a.localeCompare(b));
}
