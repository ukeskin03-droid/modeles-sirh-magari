/**
 * FORMAT DE PACK — fichier pack.json
 *
 * Un pack est le format d'échange d'une communauté : il sert à transporter un
 * paramétrage d'une installation à une autre, et à charger les exemples.
 * Ce fichier décrit le contenu attendu de pack.json (la configuration). Les contenus
 * (questions, actualités, articles…) sont des sections séparées, ajoutées par chaque
 * module au fil des phases. Le format complet est documenté dans CREER_UN_ESPACE.md.
 *
 * Un pack ne contient JAMAIS de données personnelles.
 */
import { z } from "zod";
import { homeSchema, settingsSchema, themeSchema, vocabularySchema } from "@/core/community/schema";

/** Version du format produite et comprise par cette version de l'application. */
export const PACK_FORMAT_VERSION = 1;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "identifiant attendu en minuscules, chiffres et tirets");

const categorySchema = z.object({
  slug,
  name: z.string().trim().min(1).max(80),
  // Deux niveaux au maximum : une sous-catégorie n'a pas d'enfants.
  children: z.array(z.object({ slug, name: z.string().trim().min(1).max(80) })).default([]),
});

export const packManifestSchema = z.object({
  formatVersion: z.number().int().positive(),
  exportedAt: z.string().optional(),
  identity: z.object({
    name: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().max(160).default(""),
    /** Chemins vers des fichiers du dossier media/ du pack */
    logo: z.string().optional(),
    favicon: z.string().optional(),
  }),
  theme: themeSchema.optional(),
  vocabulary: vocabularySchema.default({}),
  /** État et réglages de chaque module, par clé de module */
  modules: z.record(z.string(), z.object({ enabled: z.boolean(), settings: z.record(z.string(), z.unknown()).default({}) })).default({}),
  categories: z.array(categorySchema).default([]),
  home: homeSchema.optional(),
  settings: settingsSchema.optional(),
});

export type PackManifest = z.infer<typeof packManifestSchema>;

/** Un pack lu depuis un dossier ou un .zip : sa configuration et ses fichiers. */
export type Pack = {
  manifest: PackManifest;
  /** Contenu des fichiers du pack, par chemin relatif (ex. "media/logo.svg") */
  files: Map<string, Buffer>;
};

/** Erreur de lecture d'un pack, avec des messages destinés à l'utilisateur. */
export class PackError extends Error {
  constructor(public readonly details: string[]) {
    super(details.join(" ; "));
  }
}

/** Contrôle le contenu de pack.json et le renvoie avec ses valeurs par défaut. */
export function parsePackManifest(raw: unknown): PackManifest {
  const result = packManifestSchema.safeParse(raw);
  if (!result.success) {
    throw new PackError(result.error.issues.map((issue) => `pack.json › ${issue.path.join(" › ") || "(racine)"} : ${issue.message}`));
  }
  if (result.data.formatVersion > PACK_FORMAT_VERSION) {
    throw new PackError([
      `pack.json : ce pack utilise la version ${result.data.formatVersion} du format, plus récente que celle de cette application (${PACK_FORMAT_VERSION}). Mettez l'application à jour avant de l'importer.`,
    ]);
  }
  return result.data;
}
