/**
 * Fabrique le traducteur de la communauté : les libellés de l'application, avec le
 * vocabulaire que la communauté a choisi. Utilisable hors d'une page (e-mails, tâches).
 */
import { createTranslator, mergeVocabulary, type Translator } from "@/core/i18n/translate";
import { allLabels, defaultVocabulary } from "@/core/modules/registry";
import { loadCommunity, type CommunityConfig } from "./service";

export function translatorFor(community: Pick<CommunityConfig, "vocabulary">): Translator {
  return createTranslator(allLabels(), mergeVocabulary(defaultVocabulary(), community.vocabulary));
}

export async function loadTranslator(): Promise<Translator> {
  return translatorFor(await loadCommunity());
}

/** Nom à afficher : celui de la communauté, ou un nom par défaut tant qu'il n'est pas choisi. */
export function displayName(community: Pick<CommunityConfig, "name">, t: Translator): string {
  return community.name.trim() || t("core.community.defaultName");
}
