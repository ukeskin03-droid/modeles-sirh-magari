/**
 * Applique la CONFIGURATION d'un pack à la communauté : identité, thème, vocabulaire,
 * état des modules, catégories, page d'accueil, réglages, logo et favicon.
 *
 * Renvoie la liste des remarques à montrer à l'utilisateur (ex. « ce pack mentionne un
 * module que cette application ne connaît pas »).
 */
import { DEFAULT_HOME, DEFAULT_SETTINGS, DEFAULT_THEME } from "@/core/community/schema";
import { loadCommunity, saveCommunity } from "@/core/community/service";
import { db, type JsonValue } from "@/core/db/client";
import { deleteMedia, saveMedia } from "@/core/media/service";
import { activeModules, allModules } from "@/core/modules/registry";
import { PackError, type Pack } from "./schema";

async function importImage(pack: Pack, filePath: string | undefined, alt: string, warnings: string[]): Promise<string | null> {
  if (!filePath) return null;
  const data = pack.files.get(filePath);
  if (!data) {
    warnings.push(`Le fichier « ${filePath} » indiqué dans pack.json est absent du pack.`);
    return null;
  }
  return saveMedia({ filename: filePath, data, alt, isPublic: true });
}

export async function applyPackConfig(pack: Pack): Promise<{ warnings: string[] }> {
  const { manifest } = pack;
  const warnings: string[] = [];
  const installed = allModules();

  // ── Modules : on vérifie d'abord qu'il en restera au moins un actif.
  const states = new Map(installed.map((module) => [module.key, manifest.modules[module.key]?.enabled ?? module.defaultEnabled]));
  if (activeModules(states).length === 0) {
    throw new PackError(["Ce pack désactive tous les modules : une communauté doit en garder au moins un actif."]);
  }
  for (const key of Object.keys(manifest.modules)) {
    if (!installed.some((module) => module.key === key)) {
      warnings.push(`Le module « ${key} » mentionné dans le pack n'existe pas dans cette application : il est ignoré.`);
    }
  }

  // ── Images d'identité
  const previous = await loadCommunity();
  const logoMediaId = await importImage(pack, manifest.identity.logo, manifest.identity.name, warnings);
  const faviconMediaId = await importImage(pack, manifest.identity.favicon, "", warnings);

  // ── Configuration
  await saveCommunity({
    name: manifest.identity.name,
    subtitle: manifest.identity.subtitle,
    logoMediaId,
    faviconMediaId,
    theme: manifest.theme ?? DEFAULT_THEME,
    vocabulary: manifest.vocabulary,
    home: manifest.home ?? DEFAULT_HOME,
    settings: manifest.settings ?? DEFAULT_SETTINGS,
  });
  // Les anciennes images d'identité ne servent plus.
  for (const oldId of [previous.logoMediaId, previous.faviconMediaId]) {
    if (oldId) await deleteMedia(oldId);
  }

  // ── État et réglages des modules
  for (const mod of installed) {
    const enabled = states.get(mod.key) ?? mod.defaultEnabled;
    const settings = (manifest.modules[mod.key]?.settings ?? {}) as JsonValue;
    await db().moduleState.upsert({
      where: { key: mod.key },
      create: { key: mod.key, enabled, settings },
      update: { enabled, settings },
    });
  }

  // ── Catégories (créées ou mises à jour ; aucune catégorie existante n'est supprimée)
  for (const [position, category] of manifest.categories.entries()) {
    const parent = await db().category.upsert({
      where: { path: category.slug },
      create: { path: category.slug, name: category.name, position },
      update: { name: category.name, position, parentId: null },
    });
    for (const [childPosition, child] of category.children.entries()) {
      const childPath = `${category.slug}/${child.slug}`;
      await db().category.upsert({
        where: { path: childPath },
        create: { path: childPath, name: child.name, position: childPosition, parentId: parent.id },
        update: { name: child.name, position: childPosition, parentId: parent.id },
      });
    }
  }

  return { warnings };
}
