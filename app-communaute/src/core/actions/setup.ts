"use server";

/**
 * ACTIONS DE CONFIGURATION — les écrans de l'assistant et des paramètres.
 *
 * Toutes exigent le droit « configurer la communauté » (administrateurs).
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isValidCategoryTree, saveCategoryTree, type CategoryTreeInput } from "@/core/categories/service";
import { homeSchema, settingsSchema, themeSchema, vocabularySchema, type VocabularyConfig } from "@/core/community/schema";
import { loadCommunity, saveCommunity } from "@/core/community/service";
import { MediaError, saveMedia } from "@/core/media/service";
import { defaultVocabulary, homeBlocksFor } from "@/core/modules/registry";
import { getActiveModules, getT, requireCan } from "@/core/request/context";
import { setupSteps } from "@/core/setup/steps";
import type { FormState } from "@/core/ui/forms";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

/**
 * Après l'enregistrement d'une étape : pendant l'assistant, on passe à l'étape suivante
 * (ou précédente) ; sinon, on reste sur l'écran avec un message de confirmation.
 */
async function proceed(current: string, data: FormData): Promise<FormState> {
  const [community, active, t] = await Promise.all([loadCommunity(), getActiveModules(), getT()]);
  if (community.setupStep === null) {
    refresh();
    return { notice: t("core.form.saved") };
  }
  const steps = setupSteps(active, true);
  const index = steps.findIndex((step) => step.slug === current);
  const target = Math.min(steps.length - 1, Math.max(0, index + (text(data, "direction") === "previous" ? -1 : 1)));
  await saveCommunity({ setupStep: Math.max(community.setupStep, target) });
  redirect(steps[target].href);
}

/** Étape 1 — partir d'une communauté vierge. */
export async function startBlankAction(): Promise<void> {
  await requireCan("core.community.configure");
  const community = await loadCommunity();
  if (community.setupStep !== null) await saveCommunity({ setupStep: Math.max(community.setupStep, 1) });
  redirect("/admin/configuration/modules");
}

/** Étape 3 — identité : nom, sous-titre, logo, favicon. */
export async function saveIdentityAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  const t = await getT();
  const name = text(data, "name").trim();
  if (!name || name.length > 80) return { error: t("core.config.identity.error.name") };

  const community = await loadCommunity();
  const images: { logoMediaId: string | null; faviconMediaId: string | null } = { logoMediaId: community.logoMediaId, faviconMediaId: community.faviconMediaId };
  for (const [field, key] of [["logo", "logoMediaId"], ["favicon", "faviconMediaId"]] as const) {
    if (data.get(`${field}-remove`) === "on") images[key] = null;
    const file = data.get(field);
    if (file instanceof File && file.size > 0) {
      try {
        // Le logo et le favicon sont visibles sans connexion (page de connexion, onglet du navigateur).
        images[key] = (await saveMedia({ filename: file.name, data: Buffer.from(await file.arrayBuffer()), alt: name, isPublic: true })).id;
      } catch (error) {
        if (error instanceof MediaError) return { error: t(`core.admin.media.error.${error.reason}`, { file: file.name }) };
        throw error;
      }
    }
  }
  await saveCommunity({ name, subtitle: text(data, "subtitle").trim().slice(0, 160), ...images });
  return proceed("identite", data);
}

/** Étape 4 — apparence : couleurs et police. */
export async function saveThemeAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  const parsed = themeSchema.safeParse({ colors: { primary: text(data, "primary"), accent: text(data, "accent") }, font: text(data, "font") });
  if (!parsed.success) return { error: (await getT())("core.config.theme.error") };
  await saveCommunity({ theme: parsed.data });
  return proceed("apparence", data);
}

/** Étape 5 — vocabulaire : seuls les termes des modules actifs sont modifiés. */
export async function saveVocabularyAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  const [community, active, t] = await Promise.all([loadCommunity(), getActiveModules(), getT()]);
  const vocabulary: VocabularyConfig = { ...community.vocabulary };
  for (const [key, fallback] of Object.entries(defaultVocabulary(active))) {
    const singular = text(data, `singular:${key}`).trim();
    const plural = text(data, `plural:${key}`).trim();
    if (!singular && !plural) delete vocabulary[key]; // retour au terme par défaut
    else if (!singular || !plural) return { error: t("core.config.vocabulary.error") };
    else if (singular === fallback.singular && plural === fallback.plural) delete vocabulary[key];
    else vocabulary[key] = { singular, plural };
  }
  const parsed = vocabularySchema.safeParse(vocabulary);
  if (!parsed.success) return { error: t("core.config.vocabulary.error") };
  await saveCommunity({ vocabulary: parsed.data });
  return proceed("vocabulaire", data);
}

/** Étape 6 — catégories. */
export async function saveCategoriesAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  let tree: CategoryTreeInput;
  try {
    tree = JSON.parse(text(data, "tree")) as CategoryTreeInput;
  } catch {
    tree = [];
  }
  if (!isValidCategoryTree(tree)) return { error: (await getT())("core.config.categories.error") };
  await saveCategoryTree(tree);
  return proceed("categories", data);
}

/** Étape 7 — page d'accueil : texte et blocs (parmi ceux des modules actifs). */
export async function saveHomeAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  const active = await getActiveModules();
  const available = new Set(homeBlocksFor(active, null).map((block) => block.id));
  let blocks: string[] = [];
  try {
    blocks = (JSON.parse(text(data, "blocks")) as unknown[]).map(String).filter((id) => available.has(id));
  } catch {
    blocks = [];
  }
  const parsed = homeSchema.safeParse({ welcomeTitle: text(data, "welcomeTitle").trim(), welcomeText: text(data, "welcomeText").trim(), blocks });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "" };
  await saveCommunity({ home: parsed.data });
  return proceed("accueil", data);
}

/** Étape 8 — fin de l'assistant. */
export async function finishSetupAction(): Promise<void> {
  await requireCan("core.community.configure");
  await saveCommunity({ setupStep: null });
  refresh();
  redirect("/admin/parametres");
}

/** Paramètres — durée de conservation du journal et aperçu des liens partagés. */
export async function saveSettingsAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  const t = await getT();
  const parsed = settingsSchema.safeParse({ activityRetentionMonths: Number(text(data, "activityRetentionMonths")), sharePreview: text(data, "sharePreview") });
  if (!parsed.success) return { error: t("core.admin.settings.other.error") };
  await saveCommunity({ settings: parsed.data });
  refresh();
  return { notice: t("core.form.saved") };
}
