/**
 * EXPORT D'UN PACK
 *
 * Deux contenus possibles :
 *  - « configuration seule » : identité, apparence, vocabulaire, modules, catégories,
 *    page d'accueil, réglages (+ logo et favicon) ;
 *  - « configuration + contenus » : la même chose, plus les sections de chaque module et
 *    toutes les images de la médiathèque.
 *
 * Un pack ne contient JAMAIS de données personnelles : ni comptes, ni groupes, ni
 * résultats, ni marques de lecture, ni journal d'activité, ni nom d'auteur.
 */
import { loadCommunity } from "@/core/community/service";
import { db } from "@/core/db/client";
import { allModules, packSectionsCatalog } from "@/core/modules/registry";
import { exportPackMedia, MEDIA_FOLDER } from "./media";
import { PACK_FORMAT_VERSION, type PackManifest } from "./schema";

export async function exportPack(options: { includeContents: boolean; now?: Date }): Promise<Map<string, string | Buffer>> {
  const community = await loadCommunity();
  const states = new Map((await db().moduleState.findMany()).map((state) => [state.key, state]));
  const categories = await db().category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
  const identityIds = [community.logoMediaId, community.faviconMediaId].filter((id): id is string => Boolean(id));
  const identityMedia = new Map((await db().media.findMany({ where: { id: { in: identityIds } } })).map((media) => [media.id, `${MEDIA_FOLDER}/${media.storageKey}`]));
  const lastSegment = (path: string) => path.split("/").pop()!;

  const manifest: PackManifest = {
    formatVersion: PACK_FORMAT_VERSION,
    exportedAt: (options.now ?? new Date()).toISOString(),
    identity: {
      name: community.name,
      subtitle: community.subtitle,
      logo: community.logoMediaId ? identityMedia.get(community.logoMediaId) : undefined,
      favicon: community.faviconMediaId ? identityMedia.get(community.faviconMediaId) : undefined,
    },
    theme: community.theme,
    vocabulary: community.vocabulary,
    modules: Object.fromEntries(
      allModules().map((module) => [
        module.key,
        { enabled: states.get(module.key)?.enabled ?? module.defaultEnabled, settings: (states.get(module.key)?.settings ?? {}) as Record<string, unknown> },
      ]),
    ),
    categories: categories
      .filter((category) => !category.parentId)
      .map((parent) => ({
        slug: parent.path,
        name: parent.name,
        children: categories.filter((child) => child.parentId === parent.id).map((child) => ({ slug: lastSegment(child.path), name: child.name })),
      })),
    home: community.home,
    settings: community.settings,
  };

  const files = new Map<string, string | Buffer>([["pack.json", `${JSON.stringify(manifest, null, 2)}\n`]]);
  for (const [path, content] of await exportPackMedia(options.includeContents ? undefined : identityIds)) files.set(path, content);
  if (options.includeContents) {
    for (const section of packSectionsCatalog()) {
      for (const [path, content] of await section.export()) files.set(path, content);
    }
  }
  return files;
}
