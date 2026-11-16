/**
 * ACTUALITÉS — formes des données, états et contrôles de saisie.
 */

export const NEWS_STATUSES = ["draft", "published", "archived"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

/** L'état affiché : le statut enregistré, précisé par les dates. */
export type NewsState = "draft" | "scheduled" | "published" | "expired" | "archived";

export type NewsDates = { status: string; publishAt: Date | null; expiresAt: Date | null };

/**
 * Déduit l'état d'une actualité à un instant donné :
 *  - publiée avec une date de publication future → « programmée » ;
 *  - publiée avec une date d'expiration passée → « expirée ».
 */
export function newsState(item: NewsDates, now: Date = new Date()): NewsState {
  if (item.status === "archived") return "archived";
  if (item.status !== "published") return "draft";
  if (item.publishAt && item.publishAt.getTime() > now.getTime()) return "scheduled";
  if (item.expiresAt && item.expiresAt.getTime() <= now.getTime()) return "expired";
  return "published";
}

/** Les lecteurs ne voient que les actualités dans l'état « publiée ». */
export function isVisibleToReaders(item: NewsDates, now: Date = new Date()): boolean {
  return newsState(item, now) === "published";
}

export type NewsInput = {
  title: string;
  summary: string;
  content: string;
  categoryId: string | null;
  status: NewsStatus;
  publishAt: Date | null;
  expiresAt: Date | null;
  pinned: boolean;
};

export type InputIssue = { key: string; params?: Record<string, string | number> };

export function checkNews(input: NewsInput): InputIssue[] {
  const issues: InputIssue[] = [];
  if (!input.title.trim()) issues.push({ key: "news.error.title" });
  if (input.title.length > 150) issues.push({ key: "news.error.titleLength" });
  if (input.summary.length > 500) issues.push({ key: "news.error.summaryLength" });
  if (input.content.length > 100_000) issues.push({ key: "news.error.contentLength" });
  if (!(NEWS_STATUSES as readonly string[]).includes(input.status)) issues.push({ key: "news.error.status" });
  if (input.publishAt && input.expiresAt && input.expiresAt.getTime() <= input.publishAt.getTime()) issues.push({ key: "news.error.expiry" });
  return issues;
}
