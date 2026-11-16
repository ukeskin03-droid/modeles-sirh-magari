/**
 * ACTUALITÉS — le type de contenu « actualité », tel que le reste de l'application peut le désigner.
 */
import { db } from "@/core/db/client";
import type { ContentSummary, ContentTypeDefinition } from "@/core/modules/types";
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
    labelKey: "news.type.item",
    findByKey: async (key) => (await db().newsItem.findUnique({ where: { slug: key }, select: { id: true } }))?.id ?? null,
    summarize: async (id) => {
      const item = await db().newsItem.findUnique({ where: { id } });
      return item ? summarize(item) : null;
    },
    list: async () => (await db().newsItem.findMany({ orderBy: { title: "asc" } })).map(summarize),
  },
];
