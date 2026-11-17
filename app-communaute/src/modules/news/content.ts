/**
 * ACTUALITÉS — le type de contenu « actualité », tel que le reste de l'application peut le désigner.
 */
import { db } from "@/core/db/client";
import type { ContentSummary, ContentTypeDefinition, PersonalDataDefinition, SearchProviderDefinition } from "@/core/modules/types";
import { containsAllWords, excerptAround } from "@/core/search/service";
import { isVisibleToReaders, type NewsDates } from "./model";

const summarize = (item: { id: string; slug: string; title: string; summary: string } & NewsDates): ContentSummary => ({
  id: item.id,
  key: item.slug,
  title: item.title,
  description: item.summary,
  url: `/actualites/${item.slug}`,
  visible: isVisibleToReaders(item),
});

export const newsContentTypes: ContentTypeDefinition[] = [
  {
    type: "news.item",
    urlPrefix: "/actualites/",
    labelKey: "news.type.item",
    findByKey: async (key) => (await db().newsItem.findUnique({ where: { slug: key }, select: { id: true } }))?.id ?? null,
    summarize: async (id) => {
      const item = await db().newsItem.findUnique({ where: { id } });
      return item ? summarize(item) : null;
    },
    list: async () => (await db().newsItem.findMany({ orderBy: { title: "asc" } })).map(summarize),
  },
];

/** Recherche : les actualités visibles des lecteurs qui contiennent les mots cherchés. */
export const newsSearchProviders: SearchProviderDefinition[] = [
  {
    id: "news.items",
    labelKey: "news.page.title",
    search: async (words) => {
      const items = await db().newsItem.findMany({ where: { status: "published", AND: containsAllWords(words) }, orderBy: { publishAt: "desc" }, take: 40 });
      return items
        .filter((item) => isVisibleToReaders(item))
        .slice(0, 20)
        .map((item) => ({ id: item.id, title: item.title, excerpt: excerptAround(item.summary || item.content, words), url: `/actualites/${item.slug}` }));
    },
  },
];

/** Données personnelles : les marques de lecture de la personne, et sa signature d'auteur. */
export const newsPersonalData: PersonalDataDefinition = {
  export: async (userId) => {
    const reads = await db().newsRead.findMany({ where: { userId }, include: { news: { select: { title: true } } }, orderBy: { readAt: "asc" } });
    const authored = await db().newsItem.findMany({ where: { authorId: userId }, select: { title: true } });
    return { read: reads.map((entry) => ({ title: entry.news.title, readAt: entry.readAt })), authored: authored.map((item) => item.title) };
  },
  erase: async (userId) => {
    await db().newsRead.deleteMany({ where: { userId } });
    // Les contenus rédigés restent en ligne, mais ne sont plus rattachés à la personne.
    await db().newsItem.updateMany({ where: { authorId: userId }, data: { authorId: null } });
  },
};
