/**
 * Liens entre contenus dans un pack.
 *
 * Dans un pack, un lien s'écrit « type:identifiant », ex. "knowledge.article:mon-article".
 * À l'import, les liens sont créés une fois TOUTES les sections importées, pour que le
 * contenu visé existe déjà, quel que soit l'ordre des fichiers.
 */
import { setLinks } from "@/core/content/links";
import { db } from "@/core/db/client";
import type { Translator } from "@/core/i18n/translate";
import { allModules, findContentType } from "@/core/modules/registry";
import type { PackSectionReport } from "@/core/modules/types";

/** Le champ lié (tous modules installés confondus) qui relie ces deux types de contenu. */
function fieldBetween(hostType: string, targetType: string) {
  return allModules()
    .flatMap((module) => module.linkedFields)
    .find((field) => field.hostType === hostType && field.targetType === targetType);
}

/** Crée les liens déclarés par les sections. Renvoie les remarques éventuelles. */
export async function applyPackLinks(pending: PackSectionReport["links"], t: Translator): Promise<string[]> {
  const warnings: string[] = [];
  // Regroupement : un contenu hôte + une relation → la liste de ses cibles.
  const groups = new Map<string, { fromType: string; fromId: string; relation: string; targetType: string; targetIds: string[] }>();

  for (const link of pending) {
    const separator = link.to.indexOf(":");
    const targetType = link.to.slice(0, separator);
    const targetKey = link.to.slice(separator + 1);
    const field = separator > 0 ? fieldBetween(link.fromType, targetType) : undefined;
    if (!field) {
      warnings.push(`${link.fromKey} : ${t("core.pack.unknownLinkKind", { target: link.to })}`);
      continue;
    }
    const fromId = await findContentType(link.fromType)?.findByKey(link.fromKey);
    const targetId = await findContentType(targetType)?.findByKey(targetKey);
    if (!fromId || !targetId) {
      warnings.push(`${link.fromKey} : ${t("core.pack.unknownLinkTarget", { target: link.to })}`);
      continue;
    }
    const groupKey = `${link.fromType}|${fromId}|${field.id}`;
    const group = groups.get(groupKey) ?? { fromType: link.fromType, fromId, relation: field.id, targetType, targetIds: [] };
    group.targetIds.push(targetId);
    groups.set(groupKey, group);
  }

  for (const group of groups.values()) {
    await setLinks({ type: group.fromType, id: group.fromId }, group.relation, group.targetType, group.targetIds);
  }
  return warnings;
}

/** À l'export : les liens d'un contenu, au format « type:identifiant ». */
export async function linkStringsFrom(fromType: string, fromId: string): Promise<string[]> {
  const links = await db().contentLink.findMany({ where: { fromType, fromId }, orderBy: [{ relation: "asc" }, { position: "asc" }] });
  const result: string[] = [];
  for (const link of links) {
    const summary = await findContentType(link.toType)?.summarize(link.toId);
    if (summary) result.push(`${link.toType}:${summary.key}`);
  }
  return result;
}

/** Lit un fichier JSON du pack qui doit contenir une liste. Renvoie null si le fichier est absent. */
export function readJsonList(files: ReadonlyMap<string, Buffer>, file: string, t: Translator, warnings: string[]): unknown[] | null {
  const content = files.get(file);
  if (!content) return null;
  try {
    const parsed: unknown = JSON.parse(content.toString("utf8"));
    if (Array.isArray(parsed)) return parsed;
    warnings.push(t("core.pack.notAList", { file }));
  } catch (error) {
    warnings.push(t("core.pack.invalidJson", { file, detail: error instanceof Error ? error.message : "" }));
  }
  return [];
}
