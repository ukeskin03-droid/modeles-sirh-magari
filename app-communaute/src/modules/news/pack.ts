/**
 * ACTUALITÉS — sa section de pack : le dossier news/, un fichier Markdown par actualité.
 *
 *   news/reunion-de-rentree.md
 *   ---
 *   title: Réunion de rentrée
 *   summary: Résumé en une phrase
 *   category: parent/enfant
 *   status: published            (draft, published ou archived)
 *   publishAt: 2026-09-01T08:00:00.000Z
 *   expiresAt: 2026-10-01T08:00:00.000Z
 *   pinned: true
 *   ---
 *   Le contenu, en Markdown…
 *
 * Le nom du fichier (sans « .md ») est l'identifiant stable de l'actualité.
 */
import { categoriesById, categoryIdsByPath, listCategories } from "@/core/categories/service";
import { isSlug } from "@/core/content/text";
import { db } from "@/core/db/client";
import type { PackSectionDefinition, PackSectionReport } from "@/core/modules/types";
import { markdownFilesIn, parseFrontMatter, stringifyFrontMatter } from "@/core/pack/frontmatter";
import { checkNews, NEWS_STATUSES, type InputIssue, type NewsInput } from "./model";
import { saveNews } from "./service";

export const NEWS_FOLDER = "news";

const asText = (value: unknown) => (typeof value === "string" ? value : value === undefined || value === null ? "" : String(value));

/** Lit une date de l'en-tête (texte ou date). « invalid » si elle est illisible. */
function readDate(value: unknown): Date | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(asText(value));
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

const sameDate = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null);

const newsSection: PackSectionDefinition = {
  id: "news.items",
  labelKey: "news.pack.items",

  async import(files, { t }) {
    const report: PackSectionReport = { created: 0, updated: 0, unchanged: 0, warnings: [], links: [] };
    const categoryIds = categoryIdsByPath(await listCategories());

    for (const [slug, text] of markdownFilesIn(files, NEWS_FOLDER)) {
      const where = `${NEWS_FOLDER}/${slug}.md`;
      const { data, body, error } = parseFrontMatter(text);
      const issues: InputIssue[] = [];
      if (error) issues.push({ key: "news.error.frontMatter", params: { detail: error } });
      if (!isSlug(slug)) issues.push({ key: "core.pack.invalidSlug", params: { slug } });

      const publishAt = readDate(data.publishAt);
      const expiresAt = readDate(data.expiresAt);
      for (const [name, value] of [["publishAt", publishAt], ["expiresAt", expiresAt]] as const) {
        if (value === "invalid") issues.push({ key: "news.error.date", params: { value: asText(data[name]) } });
      }
      const categoryPath = asText(data.category).trim();
      if (categoryPath && !categoryIds.has(categoryPath)) report.warnings.push(`${where} : ${t("core.pack.unknownCategory", { path: categoryPath })}`);
      const status = asText(data.status).trim() || "draft";

      const input: NewsInput = {
        title: asText(data.title),
        summary: asText(data.summary),
        content: body,
        categoryId: categoryPath ? (categoryIds.get(categoryPath) ?? null) : null,
        status: NEWS_STATUSES.find((value) => value === status) ?? "draft",
        publishAt: publishAt === "invalid" ? null : publishAt,
        expiresAt: expiresAt === "invalid" ? null : expiresAt,
        pinned: data.pinned === true,
      };
      if (!(NEWS_STATUSES as readonly string[]).includes(status)) issues.push({ key: "news.error.status" });
      issues.push(...checkNews(input));
      if (issues.length > 0) {
        for (const issue of issues) report.warnings.push(`${where} : ${t(issue.key, issue.params)}`);
        continue;
      }

      const existing = await db().newsItem.findUnique({ where: { slug } });
      if (!existing) {
        await saveNews(null, input, { slug });
        report.created++;
      } else if (
        existing.title === input.title.trim() &&
        existing.summary === input.summary.trim() &&
        existing.content === input.content.trim() &&
        existing.categoryId === input.categoryId &&
        existing.status === input.status &&
        existing.pinned === input.pinned &&
        sameDate(existing.expiresAt, input.expiresAt) &&
        // Sans date dans le pack, on ne compare pas la date de publication (fixée à l'import).
        (input.publishAt === null || sameDate(existing.publishAt, input.publishAt))
      ) {
        report.unchanged++;
      } else {
        await saveNews(existing.id, input);
        report.updated++;
      }
    }
    return report;
  },

  async export() {
    const categories = categoriesById(await listCategories());
    const files = new Map<string, string>();
    for (const item of await db().newsItem.findMany({ orderBy: { slug: "asc" } })) {
      files.set(
        `${NEWS_FOLDER}/${item.slug}.md`,
        stringifyFrontMatter(
          {
            title: item.title,
            summary: item.summary,
            category: item.categoryId ? categories.get(item.categoryId)?.path : undefined,
            status: item.status,
            publishAt: item.publishAt?.toISOString(),
            expiresAt: item.expiresAt?.toISOString(),
            pinned: item.pinned || undefined,
          },
          item.content,
        ),
      );
    }
    return files;
  },
};

export const newsPackSections = [newsSection];
