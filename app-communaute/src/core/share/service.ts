/**
 * PARTAGE
 *
 * - Liens courts : /l/<code> renvoie vers un contenu, en notant le clic dans le journal.
 * - Aperçu de partage : le titre, le résumé et l'image qu'une messagerie affiche quand on
 *   y colle un lien. Selon le réglage de la communauté, l'aperçu est « complet » ou
 *   « neutre » (nom de la communauté seulement).
 */
import crypto from "node:crypto";
import { loadCommunity } from "@/core/community/service";
import { displayName, translatorFor } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { activeModules, findContentByPath, findContentType } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // sans caractères ambigus (l, o, 0, 1)

function newCode(): string {
  return [...crypto.randomBytes(8)].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/** Le lien court d'un contenu pour un canal donné (créé au premier besoin, puis réutilisé). */
export async function shareCodeFor(contentType: string, contentId: string, channel = "link"): Promise<string> {
  const existing = await db().shareLink.findUnique({ where: { contentType_contentId_channel: { contentType, contentId, channel } } });
  if (existing) return existing.code;
  for (;;) {
    const code = newCode();
    if (await db().shareLink.findUnique({ where: { code } })) continue;
    return (await db().shareLink.create({ data: { code, contentType, contentId, channel } })).code;
  }
}

/** Le contenu visé par un lien court (null si le lien, le contenu ou son module n'existe plus). */
export async function resolveShareCode(code: string): Promise<{ contentType: string; contentId: string; channel: string; url: string } | null> {
  const link = await db().shareLink.findUnique({ where: { code } });
  if (!link) return null;
  const active = activeModules(await readModuleStates());
  const summary = await findContentType(link.contentType, active)?.summarize(link.contentId);
  if (!summary?.url) return null;
  return { contentType: link.contentType, contentId: link.contentId, channel: link.channel, url: summary.url };
}

export type SharePreview = {
  /** Vrai si l'aperçu décrit le contenu ; faux s'il est neutre */
  detailed: boolean;
  title: string;
  description: string;
  communityName: string;
};

/**
 * L'aperçu de partage de la page située à cette adresse. Il est neutre si la communauté
 * l'a réglé ainsi, si l'adresse ne correspond à aucun contenu, si le contenu n'est pas
 * visible des lecteurs, ou si son module est désactivé.
 */
export async function sharePreviewFor(pathname: string): Promise<SharePreview> {
  const community = await loadCommunity();
  const communityName = displayName(community, translatorFor(community));
  const neutral: SharePreview = { detailed: false, title: communityName, description: community.subtitle, communityName };
  if (community.settings.sharePreview !== "full") return neutral;

  const active = activeModules(await readModuleStates());
  const content = await findContentByPath(pathname, active);
  const summary = content ? await findContentType(content.type, active)?.summarize(content.id) : null;
  if (!summary?.visible) return neutral;
  return { detailed: true, title: summary.title, description: summary.description, communityName };
}
