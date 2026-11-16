/**
 * BASE DE CONNAISSANCE — sa section de pack : le dossier articles/, un fichier Markdown
 * par article. C'est aussi le format de l'import en masse d'articles.
 *
 *   articles/premiers-pas.md
 *   ---
 *   title: Premiers pas
 *   summary: Résumé en une phrase
 *   category: parent/enfant
 *   tags: [débuter, guide]
 *   status: published            (draft ou published)
 *   revisedAt: 2026-09-01T08:00:00.000Z
 *   related: [autre-article]
 *   ---
 *   Le contenu, en Markdown…
 *
 * Le nom du fichier (sans « .md ») est l'identifiant stable de l'article.
 */
import { categoriesById, categoryIdsByPath, listCategories } from "@/core/categories/service";
import { linkedIds, setLinks } from "@/core/content/links";
import { tagsOfMany } from "@/core/content/tags";
import { isSlug } from "@/core/content/text";
import { db } from "@/core/db/client";
import type { Translator } from "@/core/i18n/translate";
import type { PackSectionDefinition, PackSectionReport } from "@/core/modules/types";
import { markdownFilesIn, parseFrontMatter, stringifyFrontMatter } from "@/core/pack/frontmatter";
import { ARTICLE_STATUSES, ARTICLE_TYPE, checkArticle, RELATED, type ArticleInput, type InputIssue } from "./model";
import { saveArticle } from "./service";

export const ARTICLES_FOLDER = "articles";

const asText = (value: unknown) => (typeof value === "string" ? value : value === undefined || value === null ? "" : String(value));
const asList = (value: unknown) => (Array.isArray(value) ? value.map(asText).map((item) => item.trim()).filter(Boolean) : []);

export type ParsedArticle = { slug: string; input: ArticleInput; related: string[]; revisedAt: Date | null; issues: InputIssue[]; warnings: InputIssue[] };

/** Analyse un fichier Markdown d'article (pack ou import en masse). */
export function parseArticleFile(slug: string, text: string, categoryIds: ReadonlyMap<string, string>): ParsedArticle {
  const { data, body, error } = parseFrontMatter(text);
  const issues: InputIssue[] = [];
  const warnings: InputIssue[] = [];
  if (error) issues.push({ key: "knowledge.error.frontMatter", params: { detail: error } });
  if (!isSlug(slug)) issues.push({ key: "core.pack.invalidSlug", params: { slug } });

  const categoryPath = asText(data.category).trim();
  if (categoryPath && !categoryIds.has(categoryPath)) warnings.push({ key: "core.pack.unknownCategory", params: { path: categoryPath } });
  const status = asText(data.status).trim() || "draft";
  if (!(ARTICLE_STATUSES as readonly string[]).includes(status)) issues.push({ key: "knowledge.error.status" });
  const revised = data.revisedAt instanceof Date ? data.revisedAt : data.revisedAt ? new Date(asText(data.revisedAt)) : null;

  const input: ArticleInput = {
    title: asText(data.title),
    summary: asText(data.summary),
    content: body,
    categoryId: categoryPath ? (categoryIds.get(categoryPath) ?? null) : null,
    status: status === "published" ? "published" : "draft",
    tags: asList(data.tags),
    relatedIds: [],
  };
  issues.push(...checkArticle(input));
  return { slug, input, related: asList(data.related), revisedAt: revised && !Number.isNaN(revised.getTime()) ? revised : null, issues, warnings };
}

/** Enregistre des articles déjà analysés, puis leurs liens « à lire aussi ». */
export async function importArticles(parsed: readonly ParsedArticle[], t: Translator): Promise<PackSectionReport> {
  const report: PackSectionReport = { created: 0, updated: 0, unchanged: 0, warnings: [], links: [] };
  const imported: ParsedArticle[] = [];

  for (const item of parsed) {
    const where = `${ARTICLES_FOLDER}/${item.slug}.md`;
    for (const issue of [...item.issues, ...item.warnings]) report.warnings.push(`${where} : ${t(issue.key, issue.params)}`);
    if (item.issues.length > 0) continue;

    const existing = await db().article.findUnique({ where: { slug: item.slug } });
    if (!existing) {
      await saveArticle(null, item.input, { slug: item.slug, revisedAt: item.revisedAt ?? undefined });
      report.created++;
    } else {
      const tags = ((await tagsOfMany(ARTICLE_TYPE, [existing.id])).get(existing.id) ?? []).map((tag) => tag.name).sort();
      const same =
        existing.title === item.input.title.trim() &&
        existing.summary === item.input.summary.trim() &&
        existing.content === item.input.content.trim() &&
        existing.categoryId === item.input.categoryId &&
        existing.status === item.input.status &&
        JSON.stringify(tags) === JSON.stringify([...item.input.tags].sort());
      if (same) report.unchanged++;
      else {
        // On conserve les liens existants : ils sont réécrits juste après.
        await saveArticle(existing.id, { ...item.input, relatedIds: await linkedIds({ type: ARTICLE_TYPE, id: existing.id }, RELATED) }, { revisedAt: item.revisedAt ?? undefined });
        report.updated++;
      }
    }
    imported.push(item);
  }

  // Seconde passe : les liens entre articles, une fois qu'ils existent tous.
  for (const item of imported) {
    const article = await db().article.findUniqueOrThrow({ where: { slug: item.slug } });
    const relatedIds: string[] = [];
    for (const slug of item.related) {
      const target = await db().article.findUnique({ where: { slug }, select: { id: true } });
      if (target) relatedIds.push(target.id);
      else report.warnings.push(`${ARTICLES_FOLDER}/${item.slug}.md : ${t("knowledge.error.unknownRelated", { slug })}`);
    }
    await setLinks({ type: ARTICLE_TYPE, id: article.id }, RELATED, ARTICLE_TYPE, relatedIds);
  }
  return report;
}

const articlesSection: PackSectionDefinition = {
  id: "knowledge.articles",
  labelKey: "knowledge.pack.articles",

  async import(files, { t }) {
    const categoryIds = categoryIdsByPath(await listCategories());
    return importArticles(markdownFilesIn(files, ARTICLES_FOLDER).map(([slug, text]) => parseArticleFile(slug, text, categoryIds)), t);
  },

  async export() {
    const categories = categoriesById(await listCategories());
    const articles = await db().article.findMany({ orderBy: { slug: "asc" } });
    const tags = await tagsOfMany(ARTICLE_TYPE, articles.map((article) => article.id));
    const slugOf = new Map(articles.map((article) => [article.id, article.slug]));
    const files = new Map<string, string>();
    for (const article of articles) {
      const related = (await linkedIds({ type: ARTICLE_TYPE, id: article.id }, RELATED)).flatMap((id) => slugOf.get(id) ?? []);
      files.set(
        `${ARTICLES_FOLDER}/${article.slug}.md`,
        stringifyFrontMatter(
          {
            title: article.title,
            summary: article.summary,
            category: article.categoryId ? categories.get(article.categoryId)?.path : undefined,
            tags: (tags.get(article.id) ?? []).map((tag) => tag.name),
            status: article.status,
            revisedAt: article.revisedAt.toISOString(),
            related,
          },
          article.content,
        ),
      );
    }
    return files;
  },
};

export const knowledgePackSections = [articlesSection];
