/**
 * BASE DE CONNAISSANCE — le type de contenu « article », tel que le reste de l'application
 * peut le désigner, et les champs que le module propose aux autres modules.
 */
import { db } from "@/core/db/client";
import type { ContentSummary, ContentTypeDefinition, LinkedFieldDefinition, PersonalDataDefinition, SearchProviderDefinition } from "@/core/modules/types";
import { containsAllWords, excerptAround } from "@/core/search/service";
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
    urlPrefix: "/articles/",
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

/** Recherche : les articles publiés (titre, résumé, contenu, mots-clés). */
export const knowledgeSearchProviders: SearchProviderDefinition[] = [
  {
    id: "knowledge.articles",
    labelKey: "knowledge.page.title",
    search: async (words) => {
      const articles = await db().article.findMany({ where: { status: "published", AND: containsAllWords(words) }, orderBy: { revisedAt: "desc" }, take: 20 });
      return articles.map((article) => ({ id: article.id, title: article.title, excerpt: excerptAround(article.summary || article.content, words), url: `/articles/${article.slug}` }));
    },
  },
];

/** Données personnelles : la signature d'auteur des articles. */
export const knowledgePersonalData: PersonalDataDefinition = {
  export: async (userId) => ({ authored: (await db().article.findMany({ where: { authorId: userId }, select: { title: true } })).map((article) => article.title) }),
  erase: async (userId) => {
    // Les articles restent en ligne, mais ne sont plus rattachés à la personne.
    await db().article.updateMany({ where: { authorId: userId }, data: { authorId: null } });
  },
};
