/**
 * BASE DE CONNAISSANCE — le type de contenu « article », tel que le reste de l'application
 * peut le désigner, et les champs que le module propose aux autres modules.
 */
import { db } from "@/core/db/client";
import type { ContentSummary, ContentTypeDefinition, LinkedFieldDefinition } from "@/core/modules/types";
import { ARTICLE_TYPE } from "./model";

const summarize = (article: { id: string; slug: string; title: string; summary: string; status: string }): ContentSummary => ({
  id: article.id,
  key: article.slug,
  title: article.title,
  description: article.summary,
  url: `/articles/${article.slug}`,
  visible: article.status === "published",
});

export const knowledgeContentTypes: ContentTypeDefinition[] = [
  {
    type: ARTICLE_TYPE,
    labelKey: "knowledge.type.article",
    findByKey: async (key) => (await db().article.findUnique({ where: { slug: key }, select: { id: true } }))?.id ?? null,
    summarize: async (id) => {
      const article = await db().article.findUnique({ where: { id } });
      return article ? summarize(article) : null;
    },
    list: async () => (await db().article.findMany({ orderBy: { title: "asc" } })).map(summarize),
  },
];

/**
 * CHAMPS LIÉS — c'est ici que la base de connaissance se « branche » sur d'autres modules,
 * sans qu'ils aient à la connaître : elle propose d'ajouter un lien vers un article au
 * formulaire d'une question de quiz et à celui d'une actualité. Ces champs n'apparaissent
 * que si la base de connaissance ET le module hôte sont actifs.
 */
export const knowledgeLinkedFields: LinkedFieldDefinition[] = [
  {
    id: "knowledge.questionArticle",
    hostType: "quiz.question",
    targetType: ARTICLE_TYPE,
    labelKey: "knowledge.linked.field",
    readerLabelKey: "knowledge.linked.reader",
    importColumn: "article_lie",
  },
  {
    id: "knowledge.newsArticle",
    hostType: "news.item",
    targetType: ARTICLE_TYPE,
    labelKey: "knowledge.linked.field",
    readerLabelKey: "knowledge.linked.reader",
    importColumn: "article_lie",
  },
];
