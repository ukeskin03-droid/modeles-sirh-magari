/**
 * BASE DE CONNAISSANCE — formes des données et contrôles de saisie.
 */

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

/** Nature du lien « articles liés » dans la table commune des liens entre contenus. */
export const RELATED = "related";
export const ARTICLE_TYPE = "knowledge.article";

export type ArticleInput = {
  title: string;
  summary: string;
  content: string;
  categoryId: string | null;
  status: ArticleStatus;
  tags: string[];
  /** Identifiants des articles liés, dans l'ordre d'affichage */
  relatedIds: string[];
};

export type InputIssue = { key: string; params?: Record<string, string | number> };

export function checkArticle(input: ArticleInput): InputIssue[] {
  const issues: InputIssue[] = [];
  if (!input.title.trim()) issues.push({ key: "knowledge.error.title" });
  if (input.title.length > 150) issues.push({ key: "knowledge.error.titleLength" });
  if (input.summary.length > 500) issues.push({ key: "knowledge.error.summaryLength" });
  if (input.content.length > 200_000) issues.push({ key: "knowledge.error.contentLength" });
  if (!(ARTICLE_STATUSES as readonly string[]).includes(input.status)) issues.push({ key: "knowledge.error.status" });
  return issues;
}
