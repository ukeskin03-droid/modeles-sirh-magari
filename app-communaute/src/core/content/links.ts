/**
 * LIENS ENTRE CONTENUS
 *
 * Un lien relie deux contenus désignés chacun par (type, identifiant). Il porte une
 * « relation » : l'identifiant du champ lié qui l'a créé (voir la rubrique linkedFields
 * du registre), ou "related" pour des contenus liés entre eux.
 */
import { db } from "@/core/db/client";

export type ContentRef = { type: string; id: string };

/** Remplace les liens d'un contenu pour une relation donnée (l'ordre est conservé). */
export async function setLinks(from: ContentRef, relation: string, targetType: string, targetIds: readonly string[]): Promise<void> {
  await db().contentLink.deleteMany({ where: { fromType: from.type, fromId: from.id, relation } });
  const unique = [...new Set(targetIds)].filter((id) => !(targetType === from.type && id === from.id));
  for (const [position, toId] of unique.entries()) {
    await db().contentLink.create({ data: { fromType: from.type, fromId: from.id, toType: targetType, toId, relation, position } });
  }
}

/** Identifiants des contenus liés à un contenu, pour une relation donnée. */
export async function linkedIds(from: ContentRef, relation: string): Promise<string[]> {
  const links = await db().contentLink.findMany({
    where: { fromType: from.type, fromId: from.id, relation },
    orderBy: { position: "asc" },
  });
  return links.map((link) => link.toId);
}

/** À appeler quand un contenu est supprimé : retire tous les liens qui le concernent. */
export async function removeLinksOf(ref: ContentRef): Promise<void> {
  await db().contentLink.deleteMany({
    where: { OR: [{ fromType: ref.type, fromId: ref.id }, { toType: ref.type, toId: ref.id }] },
  });
}
