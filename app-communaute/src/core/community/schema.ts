/**
 * FORME DE LA CONFIGURATION DE LA COMMUNAUTÉ
 *
 * La configuration est enregistrée en base sous forme de blocs JSON (thème, vocabulaire,
 * page d'accueil, réglages). Ce fichier décrit la forme attendue de chaque bloc et ses
 * valeurs par défaut. Toute valeur lue en base ou dans un pack passe par ces contrôles :
 * une valeur absente ou incorrecte est remplacée par la valeur par défaut, pour qu'une
 * configuration abîmée ne puisse jamais rendre le site inutilisable.
 */
import { z } from "zod";
import { DEFAULT_FONT, FONT_KEYS } from "@/core/theme/fonts";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

// ── Thème ────────────────────────────────────────────────────────────────────
export const DEFAULT_THEME = {
  colors: { primary: "#2f5d8a", accent: "#b4541a" },
  font: DEFAULT_FONT,
};

export const themeSchema = z.object({
  colors: z.object({ primary: hexColor, accent: hexColor }),
  font: z.enum(FONT_KEYS),
});
export type ThemeConfig = z.infer<typeof themeSchema>;

// ── Vocabulaire ──────────────────────────────────────────────────────────────
// Ex. { "news.item": { singular: "Brève", plural: "Brèves" } }
const term = z.object({
  singular: z.string().trim().min(1).max(60),
  plural: z.string().trim().min(1).max(60),
});
export const vocabularySchema = z.record(z.string(), term);
export type VocabularyConfig = z.infer<typeof vocabularySchema>;

// ── Page d'accueil ───────────────────────────────────────────────────────────
export const DEFAULT_HOME = {
  welcomeTitle: "",
  welcomeText: "",
  // null = « tous les blocs des modules actifs, dans l'ordre par défaut »
  blocks: null as string[] | null,
};

export const homeSchema = z.object({
  welcomeTitle: z.string().max(120).default(DEFAULT_HOME.welcomeTitle),
  welcomeText: z.string().max(5000).default(DEFAULT_HOME.welcomeText),
  blocks: z.array(z.string()).nullable().default(DEFAULT_HOME.blocks),
});
export type HomeConfig = z.infer<typeof homeSchema>;

// ── Autres réglages ──────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  /** Durée de conservation du journal d'activité, en mois */
  activityRetentionMonths: 12,
  /** Aperçu d'un lien partagé : "full" (titre, résumé, image) ou "neutral" (nom de la communauté) */
  sharePreview: "full" as "full" | "neutral",
};

export const settingsSchema = z.object({
  activityRetentionMonths: z.number().int().min(1).max(60).default(DEFAULT_SETTINGS.activityRetentionMonths),
  sharePreview: z.enum(["full", "neutral"]).default(DEFAULT_SETTINGS.sharePreview),
});
export type SettingsConfig = z.infer<typeof settingsSchema>;

// ── Statut ───────────────────────────────────────────────────────────────────
export const COMMUNITY_STATUSES = ["preparation", "open"] as const;
export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];

/** Lit une valeur enregistrée ; en cas d'anomalie, renvoie la valeur par défaut. */
export function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value ?? undefined);
  return result.success ? result.data : fallback;
}
