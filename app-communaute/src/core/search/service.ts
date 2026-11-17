/**
 * RECHERCHE GLOBALE
 *
 * Une seule barre de recherche, qui interroge le moteur de recherche de chaque module
 * ACTIF (rubrique « searchProviders » du registre) et regroupe les résultats par module.
 * La comparaison ignore les majuscules et les accents.
 */
import { normalizeText } from "@/core/content/text";
import type { Translator } from "@/core/i18n/translate";
import type { ModuleDefinition, SearchResult } from "@/core/modules/types";

export const SEARCH_MIN_LENGTH = 2;

/** Découpe la saisie en mots à chercher (minuscules, sans accents, 6 mots au plus). */
export function searchWords(query: string): string[] {
  const words = normalizeText(query).split(/[^a-z0-9]+/).filter((word) => word.length >= SEARCH_MIN_LENGTH);
  return [...new Set(words)].slice(0, 6);
}

/** Condition de base : le texte de recherche d'un contenu doit contenir TOUS les mots. */
export function containsAllWords(words: readonly string[]) {
  return words.map((word) => ({ searchText: { contains: word } }));
}

/** Un court extrait du texte, centré sur le premier mot trouvé. */
export function excerptAround(text: string, words: readonly string[], length = 160): string {
  const clean = text.replace(/[#*_>`|\[\]()-]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= length) return clean;
  const normalized = normalizeText(clean);
  const position = Math.max(0, ...words.map((word) => normalized.indexOf(word)).filter((index) => index >= 0).slice(0, 1));
  const start = Math.max(0, Math.min(position - 40, clean.length - length));
  return `${start > 0 ? "… " : ""}${clean.slice(start, start + length).trim()}${start + length < clean.length ? " …" : ""}`;
}

export type SearchGroup = { id: string; label: string; results: SearchResult[] };

export async function runSearch(active: readonly ModuleDefinition[], query: string, t: Translator): Promise<{ words: string[]; groups: SearchGroup[]; total: number }> {
  const words = searchWords(query);
  if (words.length === 0) return { words, groups: [], total: 0 };
  const groups: SearchGroup[] = [];
  for (const provider of active.flatMap((module) => module.searchProviders ?? [])) {
    const results = await provider.search(words);
    if (results.length > 0) groups.push({ id: provider.id, label: t(provider.labelKey), results });
  }
  return { words, groups, total: groups.reduce((sum, group) => sum + group.results.length, 0) };
}
