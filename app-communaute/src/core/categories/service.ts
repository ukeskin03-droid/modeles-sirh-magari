/**
 * CATÉGORIES — propres à la communauté, sur deux niveaux, partagées par tous les modules.
 */
import { db } from "@/core/db/client";

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
