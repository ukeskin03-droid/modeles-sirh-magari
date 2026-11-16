/**
 * LIBELLÉS DU MODULE « Base de connaissance » (français)
 *
 * Toutes les clés commencent par « knowledge. ». La syntaxe ({terme:…}, {termes:…}) est
 * expliquée dans src/core/i18n/translate.ts.
 */
export const knowledgeLabels: Record<string, string> = {
  "knowledge.name": "Base de connaissance",
  "knowledge.description": "Rassembler des contenus de référence, classés par catégorie. Module optionnel.",
  "knowledge.nav": "{termes:knowledge.article}",
  "knowledge.page.title": "{termes:knowledge.article}",
  "knowledge.page.intro": "Les contenus de référence de la communauté, classés par catégorie.",
  "knowledge.pending.title": "Module activé, écrans à venir",
  "knowledge.pending.text": "Ce module est bien actif dans la communauté. Ses écrans seront livrés à la phase 5 du projet.",
  "knowledge.block.name": "Bloc « {termes:knowledge.article} »",
  "knowledge.block.title": "{termes:knowledge.article}",
  "knowledge.block.text": "Les contenus de référence, classés par catégorie.",
  "knowledge.admin.title": "{termes:knowledge.article}",
  "knowledge.admin.description": "Rédiger et classer les {termes_min:knowledge.article}.",
};
