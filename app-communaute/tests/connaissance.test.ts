/**
 * BASE DE CONNAISSANCE — articles, mots-clés, articles liés, et liens optionnels depuis
 * les autres modules.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { linkedIds, setLinks } from "@/core/content/links";
import { parseTagList, tagsInUse, tagsOf } from "@/core/content/tags";
import { slugify } from "@/core/content/text";
import { loadCommunity } from "@/core/community/service";
import { translatorFor } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { activeModules, allModules, linkedFieldsFor } from "@/core/modules/registry";
import { readModuleStates, setModuleEnabled } from "@/core/modules/state";
import { importPack } from "@/core/pack/import";
import { readPackDirectory } from "@/core/pack/read-directory";
import { ARTICLE_TYPE, checkArticle, RELATED, type ArticleInput } from "@/modules/knowledge/model";
import { knowledgePackSections } from "@/modules/knowledge/pack";
import { deleteArticle, listPublishedArticles, relatedArticles, saveArticle } from "@/modules/knowledge/service";
import { trueFalseOptions } from "@/modules/quiz/model";
import { saveQuestion } from "@/modules/quiz/service";
import { resetDatabase } from "./support/database";

const input = (overrides: Partial<ArticleInput> = {}): ArticleInput => ({ title: "Titre", summary: "", content: "Texte", categoryId: null, status: "published", tags: [], relatedIds: [], ...overrides });
const withModules = (keys: string[]) => activeModules(new Map(allModules().map((module) => [module.key, keys.includes(module.key)])));

beforeEach(resetDatabase);

describe("outils de texte", () => {
  it("fabriquent des identifiants d'adresse lisibles", () => {
    expect(slugify("Écoles d'été 2026 !")).toBe("ecoles-d-ete-2026");
    expect(slugify("  --  ")).toBe("");
  });

  it("nettoient une liste de mots-clés", () => {
    expect(parseTagList(" Guide, débuter ;guide,  , Aide  en ligne ")).toEqual(["Guide", "débuter", "Aide en ligne"]);
  });
});

describe("articles", () => {
  it("les lecteurs ne voient que les articles publiés", async () => {
    await saveArticle(null, input({ title: "Publié" }));
    await saveArticle(null, input({ title: "Brouillon", status: "draft" }));
    expect((await listPublishedArticles()).map((article) => article.title)).toEqual(["Publié"]);
  });

  it("portent des mots-clés, filtrables, et nettoyés quand ils ne servent plus", async () => {
    const first = await saveArticle(null, input({ title: "A", tags: ["Guide", "Débuter"] }));
    await saveArticle(null, input({ title: "B", tags: ["guide"] }));
    expect((await tagsOf({ type: ARTICLE_TYPE, id: first })).map((tag) => tag.name)).toEqual(["Débuter", "Guide"]);
    expect((await listPublishedArticles({ tagSlug: "guide" })).map((article) => article.title).sort()).toEqual(["A", "B"]);
    expect((await listPublishedArticles({ tagSlug: "debuter" })).map((article) => article.title)).toEqual(["A"]);
    expect(await tagsInUse(ARTICLE_TYPE)).toEqual([{ slug: "debuter", name: "Débuter", count: 1 }, { slug: "guide", name: "Guide", count: 2 }]);

    await deleteArticle(first);
    expect((await db().tag.findMany()).map((tag) => tag.slug)).toEqual(["guide"]);
  });

  it("affichent leurs articles liés, publiés seulement, dans l'ordre choisi", async () => {
    const b = await saveArticle(null, input({ title: "B" }));
    const draft = await saveArticle(null, input({ title: "Brouillon", status: "draft" }));
    const c = await saveArticle(null, input({ title: "C" }));
    const a = await saveArticle(null, input({ title: "A", relatedIds: [c, draft, b] }));
    expect((await relatedArticles(a)).map((article) => article.title)).toEqual(["C", "B"]);
    // Un article ne peut pas être lié à lui-même.
    await saveArticle(a, input({ title: "A", relatedIds: [a, b] }));
    expect(await linkedIds({ type: ARTICLE_TYPE, id: a }, RELATED)).toEqual([b]);
    // Supprimer un article retire les liens qui pointaient vers lui.
    await deleteArticle(b);
    expect(await relatedArticles(a)).toEqual([]);
  });

  it("la date de mise à jour ne change que si le texte change", async () => {
    const id = await saveArticle(null, input({ title: "A" }), { revisedAt: new Date("2026-01-01T00:00:00Z") });
    await saveArticle(id, input({ title: "A", tags: ["nouveau"], status: "draft" }));
    expect((await db().article.findUniqueOrThrow({ where: { id } })).revisedAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    await saveArticle(id, input({ title: "A", content: "Texte modifié" }));
    expect((await db().article.findUniqueOrThrow({ where: { id } })).revisedAt.getTime()).toBeGreaterThan(Date.parse("2026-06-01"));
  });

  it("contrôlent la saisie", () => {
    expect(checkArticle(input())).toEqual([]);
    expect(checkArticle(input({ title: "" })).map((issue) => issue.key)).toEqual(["knowledge.error.title"]);
  });
});

describe("lien optionnel « question → article »", () => {
  it("le champ n'est proposé que si la base de connaissance est active", () => {
    expect(linkedFieldsFor(withModules(["quiz", "news"]), "quiz.question")).toEqual([]);
    expect(linkedFieldsFor(withModules(["quiz", "news"]), "news.item")).toEqual([]);
    expect(linkedFieldsFor(withModules(["quiz", "news", "knowledge"]), "quiz.question").map((field) => field.id)).toEqual(["knowledge.questionArticle"]);
    expect(linkedFieldsFor(withModules(["quiz", "news", "knowledge"]), "news.item").map((field) => field.id)).toEqual(["knowledge.newsArticle"]);
  });

  it("désactiver la base de connaissance masque les liens sans les perdre ; la réactiver les restaure", async () => {
    await setModuleEnabled("knowledge", true);
    const articleId = await saveArticle(null, input({ title: "Article" }));
    const questionId = await saveQuestion(null, { type: "truefalse", statement: "Q", explanation: "", difficulty: 1, categoryId: null, options: trueFalseOptions(true) });
    await setLinks({ type: "quiz.question", id: questionId }, "knowledge.questionArticle", ARTICLE_TYPE, [articleId]);

    await setModuleEnabled("knowledge", false);
    expect(linkedFieldsFor(activeModules(await readModuleStates()), "quiz.question")).toEqual([]);
    // Rien n'a été supprimé : ni l'article, ni le lien.
    expect(await db().article.count()).toBe(1);
    expect(await linkedIds({ type: "quiz.question", id: questionId }, "knowledge.questionArticle")).toEqual([articleId]);

    await setModuleEnabled("knowledge", true);
    expect(linkedFieldsFor(activeModules(await readModuleStates()), "quiz.question")).toHaveLength(1);
    expect(await linkedIds({ type: "quiz.question", id: questionId }, "knowledge.questionArticle")).toEqual([articleId]);
  });
});

describe("pack d'exemple avec base de connaissance", () => {
  it("contient 3 articles et des questions liées à des articles", async () => {
    const report = await importPack(await readPackDirectory("seed/packs/peopledoc"));
    expect(report.warnings).toEqual([]);
    expect(report.sections.find((section) => section.id === "knowledge.articles")?.created).toBe(3);

    const articles = await db().article.findMany();
    expect(articles.every((article) => article.title.startsWith("[CONTENU D'EXEMPLE — À VALIDER]") && article.content.startsWith("[CONTENU D'EXEMPLE — À VALIDER]"))).toBe(true);
    expect(await db().contentLink.count({ where: { fromType: "quiz.question", relation: "knowledge.questionArticle" } })).toBe(3);
    expect(await db().contentLink.count({ where: { relation: RELATED } })).toBe(3);

    const question = await db().question.findUniqueOrThrow({ where: { ref: "q-001" } });
    const [linked] = await linkedIds({ type: "quiz.question", id: question.id }, "knowledge.questionArticle");
    expect((await db().article.findUniqueOrThrow({ where: { id: linked } })).slug).toBe("premiers-pas");

    // Le vocabulaire de la communauté s'applique au champ lié.
    const t = translatorFor(await loadCommunity());
    expect(t("knowledge.linked.field")).toBe("Pour aller plus loin : fiche");
  });

  it("l'autre exemple n'a aucun article", async () => {
    const report = await importPack(await readPackDirectory("seed/packs/copropriete"));
    expect(report.sections.some((section) => section.id === "knowledge.articles")).toBe(false);
    expect(await db().article.count()).toBe(0);
    expect(await db().contentLink.count()).toBe(0);
  });

  it("importé dans une communauté sans base de connaissance : articles importés mais masqués, avec un message", async () => {
    const pack = await readPackDirectory("seed/packs/peopledoc");
    pack.manifest.modules.knowledge = { enabled: false, settings: {} };
    const report = await importPack(pack);
    expect(await db().article.count()).toBe(3);
    expect(report.warnings.some((warning) => warning.includes("Base de connaissance") && warning.includes("masqués"))).toBe(true);
    expect(linkedFieldsFor(activeModules(await readModuleStates()), "quiz.question")).toEqual([]);
  });

  it("un lien vers un article absent est signalé sans bloquer", async () => {
    const pack = await readPackDirectory("seed/packs/peopledoc");
    pack.files.delete("articles/premiers-pas.md");
    const report = await importPack(pack);
    expect(await db().question.count()).toBe(10);
    expect(report.warnings.some((warning) => warning.includes("q-001") && warning.includes("knowledge.article:premiers-pas"))).toBe(true);
    expect(report.warnings.some((warning) => warning.includes("bonnes-pratiques.md") && warning.includes("premiers-pas"))).toBe(true);
  });
});

describe("section de pack « articles »", () => {
  const section = knowledgePackSections[0];
  const t = translatorFor({ vocabulary: {} });

  it("exporte puis réimporte à l'identique", async () => {
    const b = await saveArticle(null, input({ title: "Second", tags: ["x"] }), { slug: "second", revisedAt: new Date("2026-02-02T00:00:00Z") });
    await saveArticle(null, input({ title: "Premier", summary: "Résumé", content: "## Titre\n\nTexte", tags: ["Guide", "x"], relatedIds: [b] }), { slug: "premier", revisedAt: new Date("2026-01-01T00:00:00Z") });

    const exported = await section.export();
    const files = new Map([...exported].map(([path, content]) => [path, Buffer.from(content)]));
    expect([...files.keys()]).toEqual(["articles/premier.md", "articles/second.md"]);
    expect(await section.import(files, { t })).toMatchObject({ created: 0, updated: 0, unchanged: 2, warnings: [] });

    await resetDatabase();
    expect(await section.import(files, { t })).toMatchObject({ created: 2, updated: 0, unchanged: 0, warnings: [] });
    const first = await db().article.findUniqueOrThrow({ where: { slug: "premier" } });
    expect(first).toMatchObject({ title: "Premier", summary: "Résumé", content: "## Titre\n\nTexte", status: "published" });
    expect(first.revisedAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect((await tagsOf({ type: ARTICLE_TYPE, id: first.id })).map((tag) => tag.name)).toEqual(["Guide", "x"]);
    expect((await relatedArticles(first.id)).map((article) => article.slug)).toEqual(["second"]);
    // Aucune donnée personnelle dans l'export : l'auteur n'y figure pas.
    expect([...exported.values()].join("\n")).not.toMatch(/author/i);
  });
});
