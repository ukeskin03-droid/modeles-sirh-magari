/**
 * BASE DE CONNAISSANCE — lecture et écriture en base.
 */
import { listCategories, withDescendants } from "@/core/categories/service";
import { linkedIds, removeLinksOf, setLinks } from "@/core/content/links";
import { contentIdsWithTag, removeTagsOf, setTags } from "@/core/content/tags";
import { normalizeText, uniqueSlug } from "@/core/content/text";
import { db, inTransaction } from "@/core/db/client";
import { ARTICLE_TYPE, RELATED, type ArticleInput } from "./model";

/** Adresses réservées sous /articles. */
const RESERVED_SLUGS = new Set(["nouveau"]);

export async function listPublishedArticles(options: { categoryId?: string; tagSlug?: string; limit?: number } = {}) {
  const categoryIds = options.categoryId ? withDescendants(options.categoryId, await listCategories()) : undefined;
  const taggedIds = options.tagSlug ? await contentIdsWithTag(ARTICLE_TYPE, options.tagSlug) : undefined;
  return db().article.findMany({
    where: { status: "published", categoryId: categoryIds ? { in: categoryIds } : undefined, id: taggedIds ? { in: taggedIds } : undefined },
    orderBy: [{ revisedAt: "desc" }, { title: "asc" }],
    take: options.limit,
  });
}

export async function getArticleBySlug(slug: string) {
  return db().article.findUnique({ where: { slug } });
}

export async function getArticleById(id: string) {
  return db().article.findUnique({ where: { id } });
}

export async function listArticlesForAdmin() {
  return db().article.findMany({ orderBy: [{ title: "asc" }] });
}

/** Les articles liés à un article (seulement ceux qui sont publiés, pour les lecteurs). */
export async function relatedArticles(articleId: string, publishedOnly = true) {
  const ids = await linkedIds({ type: ARTICLE_TYPE, id: articleId }, RELATED);
  const articles = await db().article.findMany({ where: { id: { in: ids }, status: publishedOnly ? "published" : undefined } });
  // On respecte l'ordre choisi par l'éditeur.
  return ids.flatMap((id) => articles.find((article) => article.id === id) ?? []);
}

/** Crée ou modifie un article (déjà contrôlé par checkArticle). Renvoie son identifiant. */
export async function saveArticle(id: string | null, input: ArticleInput, options: { slug?: string; authorId?: string | null; revisedAt?: Date } = {}): Promise<string> {
  return inTransaction(async () => {
    const data = {
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.content.trim(),
      categoryId: input.categoryId,
      status: input.status,
      searchText: normalizeText(`${input.title} ${input.summary} ${input.content} ${input.tags.join(" ")}`),
    };
    let articleId: string;
    if (id) {
      const existing = await db().article.findUniqueOrThrow({ where: { id } });
      // La date de mise à jour ne change que si le texte a réellement changé.
      const textChanged = existing.title !== data.title || existing.summary !== data.summary || existing.content !== data.content;
      await db().article.update({ where: { id }, data: { ...data, revisedAt: options.revisedAt ?? (textChanged ? new Date() : existing.revisedAt) } });
      articleId = id;
    } else {
      const isTaken = async (candidate: string) => RESERVED_SLUGS.has(candidate) || (await db().article.findUnique({ where: { slug: candidate } })) !== null;
      const created = await db().article.create({
        data: { ...data, slug: options.slug ?? (await uniqueSlug(input.title, isTaken, "article")), authorId: options.authorId ?? null, revisedAt: options.revisedAt ?? new Date() },
      });
      articleId = created.id;
    }
    await setTags({ type: ARTICLE_TYPE, id: articleId }, input.tags);
    await setLinks({ type: ARTICLE_TYPE, id: articleId }, RELATED, ARTICLE_TYPE, input.relatedIds);
    return articleId;
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await inTransaction(async () => {
    await removeTagsOf({ type: ARTICLE_TYPE, id });
    await removeLinksOf({ type: ARTICLE_TYPE, id });
    await db().article.deleteMany({ where: { id } });
  });
}
