/**
 * MOTS-CLÉS (TAGS) — communs à tous les modules. Un contenu est désigné par (type, identifiant).
 */
import { db } from "@/core/db/client";
import type { ContentRef } from "./links";
import { slugify } from "./text";

export type TagInfo = { slug: string; name: string };

/** Découpe une saisie « premier tag, second tag » en liste propre, sans doublons. */
export function parseTagList(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of text.split(/[,;\n]/)) {
    const name = part.trim().replace(/\s+/g, " ").slice(0, 40);
    const slug = slugify(name);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      result.push(name);
    }
  }
  return result.slice(0, 20);
}

/** Remplace les mots-clés d'un contenu. Les mots-clés qui ne servent plus à rien sont supprimés. */
export async function setTags(ref: ContentRef, names: readonly string[]): Promise<void> {
  await db().contentTag.deleteMany({ where: { contentType: ref.type, contentId: ref.id } });
  for (const name of parseTagList(names.join(","))) {
    const slug = slugify(name);
    const tag = await db().tag.upsert({ where: { slug }, create: { slug, name }, update: {} });
    await db().contentTag.create({ data: { tagId: tag.id, contentType: ref.type, contentId: ref.id } });
  }
  await db().tag.deleteMany({ where: { contents: { none: {} } } });
}

export async function removeTagsOf(ref: ContentRef): Promise<void> {
  await setTags(ref, []);
}

/** Les mots-clés de plusieurs contenus d'un même type : identifiant du contenu → mots-clés. */
export async function tagsOfMany(contentType: string, contentIds: readonly string[]): Promise<Map<string, TagInfo[]>> {
  const rows = await db().contentTag.findMany({
    where: { contentType, contentId: { in: [...contentIds] } },
    include: { tag: true },
    orderBy: { tag: { name: "asc" } },
  });
  const result = new Map<string, TagInfo[]>();
  for (const row of rows) {
    const list = result.get(row.contentId) ?? [];
    list.push({ slug: row.tag.slug, name: row.tag.name });
    result.set(row.contentId, list);
  }
  return result;
}

export async function tagsOf(ref: ContentRef): Promise<TagInfo[]> {
  return (await tagsOfMany(ref.type, [ref.id])).get(ref.id) ?? [];
}

/** Identifiants des contenus d'un type qui portent un mot-clé donné. */
export async function contentIdsWithTag(contentType: string, tagSlug: string): Promise<string[]> {
  const rows = await db().contentTag.findMany({ where: { contentType, tag: { slug: tagSlug } }, select: { contentId: true } });
  return rows.map((row) => row.contentId);
}

/** Tous les mots-clés utilisés par un type de contenu, avec le nombre de contenus concernés. */
export async function tagsInUse(contentType: string, contentIds?: readonly string[]): Promise<(TagInfo & { count: number })[]> {
  const rows = await db().contentTag.findMany({ where: { contentType, contentId: contentIds ? { in: [...contentIds] } : undefined }, include: { tag: true } });
  const counts = new Map<string, TagInfo & { count: number }>();
  for (const row of rows) {
    const entry = counts.get(row.tag.slug) ?? { slug: row.tag.slug, name: row.tag.name, count: 0 };
    entry.count++;
    counts.set(row.tag.slug, entry);
  }
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
