/**
 * LIBELLÉS DU MODULE « Base de connaissance » (français)
 *
 * Toutes les clés commencent par « knowledge. ». La syntaxe ({terme:…}, {termes:…}) est
 * expliquée dans src/core/i18n/translate.ts. Rappel : ne jamais accorder un mot avec un
 * terme renommable (« Article » peut devenir « Fiche » : le genre change).
 */
export const knowledgeLabels: Record<string, string> = {
  "knowledge.name": "Base de connaissance",
  "knowledge.description": "Rassembler des contenus de référence, classés par catégorie. Module optionnel.",
  "knowledge.nav": "{termes:knowledge.article}",
  "knowledge.type.article": "{terme:knowledge.article}",
  "knowledge.pack.articles": "{termes:knowledge.article} (dossier articles/)",
  "knowledge.linked.field": "Pour aller plus loin : {terme_min:knowledge.article}",
  "knowledge.linked.reader": "Pour aller plus loin :",

  // ── Lecteur
  "knowledge.page.title": "{termes:knowledge.article}",
  "knowledge.page.intro": "Les contenus de référence de la communauté, classés par catégorie.",
  "knowledge.list.empty.title": "{termes:knowledge.article} : rien à afficher",
  "knowledge.list.empty.text": "Aucun contenu publié ne correspond à ce choix.",
  "knowledge.list.filter": "Catégorie",
  "knowledge.list.tags": "Mots-clés",
  "knowledge.list.tagActive": "Mot-clé : {tag}",
  "knowledge.list.clear": "Tout afficher",
  "knowledge.list.uncategorized": "Sans catégorie",
  "knowledge.detail.back": "{termes:knowledge.article}",
  "knowledge.detail.revised": "Mis à jour le {date}",
  "knowledge.detail.author": "Rédaction : {name}",
  "knowledge.detail.related": "À lire aussi",
  "knowledge.detail.hidden": "Aperçu : ce contenu est un brouillon, les lecteurs ne le voient pas.",
  "knowledge.detail.edit": "Modifier",

  // ── Bloc d'accueil
  "knowledge.block.name": "Bloc « {termes:knowledge.article} »",
  "knowledge.block.title": "{termes:knowledge.article}",
  "knowledge.block.text": "Les contenus de référence, classés par catégorie.",
  "knowledge.block.all": "Tout voir",

  // ── Administration
  "knowledge.admin.title": "{termes:knowledge.article}",
  "knowledge.admin.description": "Rédiger et classer les {termes_min:knowledge.article}.",
  "knowledge.admin.new": "Nouveau : {terme_min:knowledge.article}",
  "knowledge.admin.empty": "{termes:knowledge.article} : rien de créé pour le moment.",
  "knowledge.admin.col.title": "Titre",
  "knowledge.admin.col.category": "Catégorie",
  "knowledge.admin.col.status": "Statut",
  "knowledge.admin.col.revised": "Mise à jour",
  "knowledge.admin.view": "Voir la page",
  "knowledge.status.draft": "Brouillon",
  "knowledge.status.published": "Publié",
  "knowledge.form.new": "Nouveau : {terme_min:knowledge.article}",
  "knowledge.form.edit": "Modifier : {terme_min:knowledge.article}",
  "knowledge.form.title": "Titre",
  "knowledge.form.summary": "Résumé",
  "knowledge.form.summaryHint": "Une ou deux phrases, affichées dans les listes, la recherche et l'aperçu des liens partagés.",
  "knowledge.form.content": "Contenu",
  "knowledge.form.status": "Statut",
  "knowledge.form.tags": "Mots-clés",
  "knowledge.form.tagsHint": "Séparés par des virgules.",
  "knowledge.form.related": "À lire aussi",
  "knowledge.form.relatedHint": "Cochez les contenus à proposer en bas de page.",
  "knowledge.form.relatedEmpty": "Aucun autre contenu pour le moment.",
  "knowledge.form.delete.title": "Supprimer ce contenu ?",
  "knowledge.form.delete.text": "Cette action est définitive. Les liens qui pointaient vers ce contenu seront retirés.",

  // ── Import en masse
  "knowledge.import.title": "{termes:knowledge.article} (fichiers Markdown)",
  "knowledge.import.description": "Un fichier .md par contenu. Le nom du fichier sert d'identifiant : le renvoyer met à jour le contenu existant.",
  "knowledge.import.template": "Modèle de fichier (Markdown)",
  "knowledge.import.col.file": "Fichier",
  "knowledge.import.col.result": "Résultat",

  // ── Messages d'erreur
  "knowledge.error.title": "Le titre est obligatoire.",
  "knowledge.error.titleLength": "Le titre est trop long (150 caractères au maximum).",
  "knowledge.error.summaryLength": "Le résumé est trop long (500 caractères au maximum).",
  "knowledge.error.contentLength": "Le contenu est trop long.",
  "knowledge.error.status": "Statut inconnu (attendu : draft ou published).",
  "knowledge.error.frontMatter": "en-tête illisible ({detail}).",
  "knowledge.error.unknownRelated": "contenu lié « {slug} » introuvable, lien ignoré.",
};
