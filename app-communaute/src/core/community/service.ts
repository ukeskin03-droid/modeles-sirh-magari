/**
 * LECTURE ET ÉCRITURE DE LA CONFIGURATION DE LA COMMUNAUTÉ
 *
 * La table « Community » ne contient qu'une ligne (id = 1). Tant qu'elle n'existe pas
 * (installation toute neuve), on renvoie une configuration par défaut.
 */
import { db, type JsonValue } from "@/core/db/client";
import {
  DEFAULT_HOME,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  homeSchema,
  parseOr,
  settingsSchema,
  themeSchema,
  vocabularySchema,
  type CommunityStatus,
  type HomeConfig,
  type SettingsConfig,
  type ThemeConfig,
  type VocabularyConfig,
} from "./schema";

const COMMUNITY_ID = 1;

export type CommunityConfig = {
  /** Faux tant que la configuration n'a jamais été enregistrée */
  exists: boolean;
  /** Vide tant qu'aucun nom n'a été choisi : l'interface affiche alors un nom par défaut */
  name: string;
  subtitle: string;
  status: CommunityStatus;
  logoMediaId: string | null;
  faviconMediaId: string | null;
  theme: ThemeConfig;
  vocabulary: VocabularyConfig;
  home: HomeConfig;
  settings: SettingsConfig;
  setupStep: number | null;
  /** Sert à savoir si la feuille de style du thème a changé */
  updatedAt: Date | null;
};

const DEFAULT_COMMUNITY: CommunityConfig = {
  exists: false,
  name: "",
  subtitle: "",
  status: "preparation",
  logoMediaId: null,
  faviconMediaId: null,
  theme: DEFAULT_THEME,
  vocabulary: {},
  home: DEFAULT_HOME,
  settings: DEFAULT_SETTINGS,
  setupStep: null,
  updatedAt: null,
};

export async function loadCommunity(): Promise<CommunityConfig> {
  const row = await db().community.findUnique({ where: { id: COMMUNITY_ID } });
  if (!row) return DEFAULT_COMMUNITY;
  return {
    exists: true,
    name: row.name,
    subtitle: row.subtitle,
    status: row.status === "open" ? "open" : "preparation",
    logoMediaId: row.logoMediaId,
    faviconMediaId: row.faviconMediaId,
    theme: parseOr(themeSchema, row.theme, DEFAULT_THEME),
    vocabulary: parseOr(vocabularySchema, row.vocabulary, {}),
    home: parseOr(homeSchema, row.home, DEFAULT_HOME),
    settings: parseOr(settingsSchema, row.settings, DEFAULT_SETTINGS),
    setupStep: row.setupStep,
    updatedAt: row.updatedAt,
  };
}

export type CommunityUpdate = Partial<
  Pick<
    CommunityConfig,
    "name" | "subtitle" | "status" | "logoMediaId" | "faviconMediaId" | "theme" | "vocabulary" | "home" | "settings" | "setupStep"
  >
>;

/** Enregistre une partie de la configuration (crée la ligne si elle n'existe pas encore). */
export async function saveCommunity(update: CommunityUpdate): Promise<void> {
  const current = await loadCommunity();
  const next = { ...current, ...update };
  const data = {
    name: next.name,
    subtitle: next.subtitle,
    status: next.status,
    logoMediaId: next.logoMediaId,
    faviconMediaId: next.faviconMediaId,
    theme: next.theme as JsonValue,
    vocabulary: next.vocabulary as JsonValue,
    home: next.home as JsonValue,
    settings: next.settings as JsonValue,
    setupStep: next.setupStep,
  };
  await db().community.upsert({
    where: { id: COMMUNITY_ID },
    create: { id: COMMUNITY_ID, ...data },
    update: data,
  });
}
