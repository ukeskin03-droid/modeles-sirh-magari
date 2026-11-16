/**
 * ACTUALITÉS — lecture et écriture en base.
 */
import { listCategories, withDescendants } from "@/core/categories/service";
import { removeLinksOf } from "@/core/content/links";
import { normalizeText, uniqueSlug } from "@/core/content/text";
import { db, inTransaction } from "@/core/db/client";
import type { NewsInput } from "./model";

/** Adresses réservées sous /actualites. */
const RESERVED_SLUGS = new Set(["nouvelle"]);

/** Condition « visible des lecteurs en ce moment » : publiée, déjà parue, pas encore expirée. */
function visibleNow(now: Date) {
  return {
    status: "published",
    AND: [{ OR: [{ publishAt: null }, { publishAt: { lte: now } }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
  };
}

/**
 * Les actualités visibles, épinglées d'abord puis de la plus récente à la plus ancienne,
 * avec pour chacune l'indication « pas encore lue par cette personne ».
 */
export async function listVisibleNews(userId: string, options: { categoryId?: string; limit?: number } = {}, now = new Date()) {
  const categoryIds = options.categoryId ? withDescendants(options.categoryId, await listCategories()) : undefined;
  const items = await db().newsItem.findMany({
    where: { ...visibleNow(now), categoryId: categoryIds ? { in: categoryIds } : undefined },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }, { createdAt: "desc" }],
    take: options.limit,
  });
  const reads = await db().newsRead.findMany({ where: { userId, newsId: { in: items.map((item) => item.id) } }, select: { newsId: true } });
  const read = new Set(reads.map((entry) => entry.newsId));
  return items.map((item) => ({ ...item, isNew: !read.has(item.id) }));
}

export async function getNewsBySlug(slug: string) {
  return db().newsItem.findUnique({ where: { slug } });
}

export async function getNewsById(id: string) {
  return db().newsItem.findUnique({ where: { id } });
}

/** Note qu'une personne a ouvert l'actualité : le badge « Nouveau » disparaît pour elle. */
export async function markNewsRead(newsId: string, userId: string): Promise<void> {
  await db().newsRead.upsert({ where: { newsId_userId: { newsId, userId } }, create: { newsId, userId }, update: {} });
}

export async function listNewsForAdmin() {
  return db().newsItem.findMany({ orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], include: { _count: { select: { reads: true } } } });
}

/** Crée ou modifie une actualité (déjà contrôlée par checkNews). Renvoie son identifiant. */
export async function saveNews(id: string | null, input: NewsInput, options: { slug?: string; authorId?: string | null } = {}): Promise<string> {
  const data = {
    title: input.title.trim(),
    summary: input.summary.trim(),
    content: input.content.trim(),
    categoryId: input.categoryId,
    status: input.status,
    // Publier sans préciser de date = publier tout de suite.
    publishAt: input.publishAt ?? (input.status === "published" ? new Date() : null),
    expiresAt: input.expiresAt,
    pinned: input.pinned,
    searchText: normalizeText(`${input.title} ${input.summary} ${input.content}`),
  };
  if (id) {
    // Sans date dans le formulaire : on garde la date de première publication si elle est
    // passée ; si elle était dans le futur (publication programmée), on publie tout de suite.
    const existing = await db().newsItem.findUnique({ where: { id }, select: { publishAt: true } });
    const alreadyOut = existing?.publishAt && existing.publishAt.getTime() <= Date.now() ? existing.publishAt : null;
    await db().newsItem.update({ where: { id }, data: { ...data, publishAt: input.publishAt ?? alreadyOut ?? data.publishAt } });
    return id;
  }
  const isTaken = async (candidate: string) => RESERVED_SLUGS.has(candidate) || (await db().newsItem.findUnique({ where: { slug: candidate } })) !== null;
  const created = await db().newsItem.create({
    data: { ...data, slug: options.slug ?? (await uniqueSlug(input.title, isTaken, "actualite")), authorId: options.authorId ?? null },
  });
  return created.id;
}

export async function deleteNews(id: string): Promise<void> {
  await inTransaction(async () => {
    await removeLinksOf({ type: "news.item", id });
    await db().newsItem.deleteMany({ where: { id } });
  });
}
