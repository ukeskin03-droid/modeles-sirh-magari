/**
 * LIBELLÉS DU MODULE « Actualités » (français)
 *
 * Toutes les clés commencent par « news. ». La syntaxe ({terme:…}, {termes:…}) est
 * expliquée dans src/core/i18n/translate.ts.
 */
export const newsLabels: Record<string, string> = {
  "news.name": "Actualités",
  "news.description": "Publier des informations datées, avec programmation, épinglage et badge « Nouveau ».",
  "news.nav": "{termes:news.item}",
  "news.page.title": "{termes:news.item}",
  "news.page.intro": "Les dernières informations de la communauté.",
  "news.pending.title": "Module activé, écrans à venir",
  "news.pending.text": "Ce module est bien actif dans la communauté. Ses écrans seront livrés à la phase 4 du projet.",
  "news.block.name": "Bloc « {termes:news.item} »",
  "news.block.title": "{termes:news.item}",
  "news.block.text": "Les dernières informations publiées.",
  "news.admin.title": "{termes:news.item}",
  "news.admin.description": "Rédiger, programmer, épingler et archiver les {termes_min:news.item}.",
};
