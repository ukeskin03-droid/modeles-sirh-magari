/**
 * CATÉGORIES — propres à la communauté, sur deux niveaux, partagées par tous les modules.
 */
import { slugify } from "@/core/content/text";
import { db, inTransaction } from "@/core/db/client";

export type CategoryNode = {
  id: string;
  /** Identifiant stable : "parent" ou "parent/enfant" */
  path: string;
  name: string;
  /** Nom complet : « Parent › Enfant » */
  label: string;
  parentId: string | null;
  depth: 0 | 1;
};

/** Toutes les catégories, dans l'ordre d'affichage (chaque parent suivi de ses enfants). */
export async function listCategories(): Promise<CategoryNode[]> {
  const rows = await db().category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
  const result: CategoryNode[] = [];
  for (const parent of rows.filter((row) => !row.parentId)) {
    result.push({ id: parent.id, path: parent.path, name: parent.name, label: parent.name, parentId: null, depth: 0 });
    for (const child of rows.filter((row) => row.parentId === parent.id)) {
      result.push({ id: child.id, path: child.path, name: child.name, label: `${parent.name} › ${child.name}`, parentId: parent.id, depth: 1 });
    }
  }
  return result;
}

/** Les identifiants d'une catégorie et de ses sous-catégories (pour filtrer « catégorie et dessous »). */
export function withDescendants(categoryId: string, categories: readonly CategoryNode[]): string[] {
  return [categoryId, ...categories.filter((category) => category.parentId === categoryId).map((category) => category.id)];
}

/** Table de correspondance identifiant → catégorie. */
export function categoriesById(categories: readonly CategoryNode[]): Map<string, CategoryNode> {
  return new Map(categories.map((category) => [category.id, category]));
}

/** Table de correspondance chemin ("parent/enfant") → identifiant, pour les packs et les imports. */
export function categoryIdsByPath(categories: readonly CategoryNode[]): Map<string, string> {
  return new Map(categories.map((category) => [category.path, category.id]));
}

// ── Éditeur d'arborescence ───────────────────────────────────────────────────

export type CategoryTreeInput = { id?: string; name: string; children: { id?: string; name: string }[] }[];

/** Vrai si l'arborescence est valide : des noms partout, deux niveaux au plus (garanti par sa forme). */
export function isValidCategoryTree(tree: CategoryTreeInput): boolean {
  const valid = (name: unknown) => typeof name === "string" && name.trim().length > 0 && name.trim().length <= 80;
  return Array.isArray(tree) && tree.every((parent) => valid(parent?.name) && Array.isArray(parent.children) && parent.children.every((child) => valid(child?.name)));
}

/**
 * Enregistre toute l'arborescence telle que l'éditeur l'a renvoyée : les catégories
 * connues sont mises à jour (nom, ordre, parent), les nouvelles créées, les absentes
 * supprimées. Les contenus d'une catégorie supprimée ne sont pas touchés : ils deviennent
 * simplement « sans catégorie ».
 */
export async function saveCategoryTree(tree: CategoryTreeInput): Promise<void> {
  await inTransaction(async () => {
    const existing = await db().category.findMany();
    const byId = new Map(existing.map((category) => [category.id, category]));
    const usedPaths = new Set<string>();
    const keptIds = new Set<string>();

    // Un identifiant stable (« chemin ») unique : on garde l'ancien quand c'est possible.
    const pathFor = (wanted: string) => {
      let path = wanted;
      for (let suffix = 2; usedPaths.has(path); suffix++) path = `${wanted}-${suffix}`;
      usedPaths.add(path);
      return path;
    };
    const lastSegment = (path: string) => path.split("/").pop()!;

    // On libère d'abord les chemins (contrainte d'unicité) en les rendant provisoires.
    for (const category of existing) await db().category.update({ where: { id: category.id }, data: { path: `~${category.id}` } });

    for (const [position, parent] of tree.entries()) {
      const known = parent.id ? byId.get(parent.id) : undefined;
      const parentPath = pathFor(known && !known.parentId ? known.path : known ? lastSegment(known.path) : slugify(parent.name) || "categorie");
      const data = { name: parent.name.trim(), position, parentId: null, path: parentPath };
      const saved = known ? await db().category.update({ where: { id: known.id }, data }) : await db().category.create({ data });
      keptIds.add(saved.id);

      for (const [childPosition, child] of parent.children.entries()) {
        const knownChild = child.id ? byId.get(child.id) : undefined;
        const segment = knownChild ? lastSegment(knownChild.path) : slugify(child.name) || "categorie";
        const childData = { name: child.name.trim(), position: childPosition, parentId: saved.id, path: pathFor(`${parentPath}/${segment}`) };
        const savedChild = knownChild ? await db().category.update({ where: { id: knownChild.id }, data: childData }) : await db().category.create({ data: childData });
        keptIds.add(savedChild.id);
      }
    }
    await db().category.deleteMany({ where: { id: { notIn: [...keptIds] } } });
  });
}
