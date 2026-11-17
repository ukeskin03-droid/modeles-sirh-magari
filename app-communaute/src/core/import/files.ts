/**
 * Lecture des fichiers d'un import en masse.
 */
import Papa from "papaparse";

/**
 * Transforme le contenu d'un fichier en texte. Un tableur enregistre souvent ses fichiers
 * CSV dans un ancien codage (Windows-1252) plutôt qu'en UTF-8 : on reconnaît les deux,
 * pour que les accents ne soient jamais abîmés.
 */
export function decodeText(data: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(data);
  }
}

export type CsvTable = { headers: string[]; rows: { line: number; values: Record<string, string> }[]; error?: string };

/** Nom de colonne simplifié : « Énoncé » et « enonce » désignent la même colonne. */
export function columnName(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

/** Lit un fichier CSV dont la première ligne donne les noms de colonnes (séparateur , ou ; détecté). */
export function parseCsv(text: string): CsvTable {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  const [headerRow, ...lines] = result.data;
  if (!headerRow) return { headers: [], rows: [] };
  const headers = headerRow.map(columnName);
  const fatal = result.errors.find((error) => error.type === "Quotes");
  return {
    headers,
    // La ligne 1 est celle des titres : la première ligne de données est la ligne 2.
    rows: lines.map((cells, index) => ({ line: index + 2, values: Object.fromEntries(headers.map((header, column) => [header, (cells[column] ?? "").trim()])) })),
    error: fatal ? `${fatal.message} (ligne ${(fatal.row ?? 0) + 1})` : undefined,
  };
}

/** Fabrique un fichier CSV lisible par un tableur français (séparateur « ; », accents préservés). */
export function buildCsv(headers: string[], rows: string[][]): string {
  return `﻿${Papa.unparse({ fields: headers, data: rows }, { delimiter: ";", newline: "\r\n" })}\r\n`;
}
