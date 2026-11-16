/**
 * LIBELLÉS DU MODULE « Actualités » (français)
 *
 * Toutes les clés commencent par « news. ». La syntaxe ({terme:…}, {termes:…}) est
 * expliquée dans src/core/i18n/translate.ts. Rappel : ne jamais accorder un mot avec un
 * terme renommable (son genre peut changer d'une communauté à l'autre).
 */
export const newsLabels: Record<string, string> = {
  "news.name": "Actualités",
  "news.description": "Publier des informations datées, avec programmation, épinglage et badge « Nouveau ».",
  "news.nav": "{termes:news.item}",
  "news.type.item": "{terme:news.item}",
  "news.pack.items": "{termes:news.item} (dossier news/)",

  // ── Lecteur
  "news.page.title": "{termes:news.item}",
  "news.page.intro": "Les dernières informations de la communauté.",
  "news.list.empty.title": "{termes:news.item} : rien à afficher pour le moment",
  "news.list.empty.text": "Les nouvelles publications apparaîtront ici.",
  "news.list.filter": "Filtrer par catégorie",
  "news.badge.new": "Nouveau",
  "news.badge.pinned": "Épinglé",
  "news.detail.back": "{termes:news.item}",
  "news.detail.published": "Publié le {date}",
  "news.detail.hidden": "Aperçu : les lecteurs ne voient pas ce contenu pour l'instant (état : {state}).",
  "news.detail.edit": "Modifier",

  // ── Bloc d'accueil
  "news.block.name": "Bloc « {termes:news.item} »",
  "news.block.title": "{termes:news.item}",
  "news.block.text": "Les dernières informations publiées.",
  "news.block.all": "Tout voir",

  // ── Administration
  "news.admin.title": "{termes:news.item}",
  "news.admin.description": "Rédiger, programmer, épingler et archiver les {termes_min:news.item}.",
  "news.admin.new": "Nouveau : {terme_min:news.item}",
  "news.admin.empty": "{termes:news.item} : rien de créé pour le moment.",
  "news.admin.col.title": "Titre",
  "news.admin.col.state": "État",
  "news.admin.col.publishAt": "Publication",
  "news.admin.col.expiresAt": "Expiration",
  "news.admin.col.reads": "Lectures",
  "news.admin.view": "Voir la page",
  "news.state.draft": "Brouillon",
  "news.state.scheduled": "Programmé",
  "news.state.published": "Publié",
  "news.state.expired": "Expiré",
  "news.state.archived": "Archivé",
  "news.form.new": "Nouveau : {terme_min:news.item}",
  "news.form.edit": "Modifier : {terme_min:news.item}",
  "news.form.title": "Titre",
  "news.form.summary": "Résumé",
  "news.form.summaryHint": "Une ou deux phrases, affichées dans la liste et dans l'aperçu des liens partagés.",
  "news.form.content": "Contenu",
  "news.form.contentHint": "Mise en forme Markdown : **gras**, # titre, - liste, [texte](adresse).",
  "news.form.status": "Statut",
  "news.status.draft": "Brouillon",
  "news.status.published": "Publié",
  "news.status.archived": "Archivé",
  "news.form.publishAt": "Date de publication",
  "news.form.publishAtHint": "Vide : publication immédiate. Une date future programme la publication.",
  "news.form.expiresAt": "Date d'expiration (facultative)",
  "news.form.expiresAtHint": "Passé cette date, les lecteurs ne voient plus le contenu.",
  "news.form.pinned": "Épingler en haut de la liste",
  "news.form.delete.title": "Supprimer ce contenu ?",
  "news.form.delete.text": "Cette action est définitive. Pour le retirer sans le perdre, choisissez plutôt le statut « Archivé ».",

  // ── Messages d'erreur
  "news.error.title": "Le titre est obligatoire.",
  "news.error.titleLength": "Le titre est trop long (150 caractères au maximum).",
  "news.error.summaryLength": "Le résumé est trop long (500 caractères au maximum).",
  "news.error.contentLength": "Le contenu est trop long.",
  "news.error.status": "Statut inconnu (attendu : draft, published ou archived).",
  "news.error.expiry": "La date d'expiration doit être postérieure à la date de publication.",
  "news.error.date": "Date illisible : « {value} » (format attendu : 2026-01-31 ou 2026-01-31T09:00:00Z).",
  "news.error.frontMatter": "en-tête illisible ({detail}).",
};
