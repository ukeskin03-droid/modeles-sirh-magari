/**
 * FINITIONS — recherche globale, liens de partage et aperçus, données personnelles.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { pseudonym, recordActivity } from "@/core/activity/log";
import { hashPassword } from "@/core/auth/password";
import { createSession, findSession } from "@/core/auth/sessions";
import { saveCommunity } from "@/core/community/service";
import { translatorFor } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { activeModules, allModules, findContentByPath } from "@/core/modules/registry";
import { readModuleStates, setModuleEnabled } from "@/core/modules/state";
import { importPack } from "@/core/pack/import";
import { readPackDirectory } from "@/core/pack/read-directory";
import { deleteOwnAccount, exportUserData } from "@/core/privacy/service";
import { excerptAround, runSearch, searchWords } from "@/core/search/service";
import { resolveShareCode, shareCodeFor, sharePreviewFor } from "@/core/share/service";
import { saveArticle } from "@/modules/knowledge/service";
import { markNewsRead, saveNews } from "@/modules/news/service";
import { answerCurrentQuestion, getAttemptView, startAttempt } from "@/modules/quiz/service";
import { resetDatabase } from "./support/database";

const t = translatorFor({ vocabulary: {} });
const active = async () => activeModules(await readModuleStates());
const news = (title: string, extra: object = {}) => saveNews(null, { title, summary: "", content: "", categoryId: null, status: "published", publishAt: new Date(Date.now() - 1000), expiresAt: null, pinned: false, ...extra });
const article = (title: string, extra: object = {}) => saveArticle(null, { title, summary: "", content: "", categoryId: null, status: "published", tags: [], relatedIds: [], ...extra });

beforeEach(resetDatabase);

describe("recherche globale", () => {
  it("ignore les majuscules et les accents, et exige tous les mots", async () => {
    await setModuleEnabled("knowledge", true);
    await news("Réunion d'été des copropriétaires", { content: "Ordre du jour : le budget." });
    await article("Préparer la réunion", { content: "Conseils pratiques.", tags: ["Été"] });
    await article("Autre sujet");

    const found = await runSearch(await active(), "REUNION ete", t);
    expect(found.total).toBe(2);
    expect(found.groups.map((group) => group.results.map((result) => result.title))).toEqual([["Réunion d'été des copropriétaires"], ["Préparer la réunion"]]);
    expect((await runSearch(await active(), "réunion budget", t)).total).toBe(1);
    expect((await runSearch(await active(), "réunion inexistant", t)).total).toBe(0);
  });

  it("ne montre que ce que les lecteurs peuvent voir", async () => {
    await setModuleEnabled("knowledge", true);
    await news("Brouillon secret", { status: "draft" });
    await news("Programmée secrète", { publishAt: new Date(Date.now() + 3_600_000) });
    await news("Expirée secrète", { publishAt: new Date(Date.now() - 7_200_000), expiresAt: new Date(Date.now() - 3_600_000) });
    await article("Article secret", { status: "draft" });
    expect((await runSearch(await active(), "secret", t)).total).toBe(0);
  });

  it("ne cherche que dans les modules actifs", async () => {
    await setModuleEnabled("knowledge", true);
    await article("Chauffage collectif");
    await news("Chauffage : coupure");
    expect((await runSearch(await active(), "chauffage", t)).groups.map((group) => group.id)).toEqual(["news.items", "knowledge.articles"]);
    await setModuleEnabled("knowledge", false);
    expect((await runSearch(await active(), "chauffage", t)).groups.map((group) => group.id)).toEqual(["news.items"]);
  });

  it("trouve aussi les quiz, par titre ou description", async () => {
    await importPack(await readPackDirectory("seed/packs/copropriete"));
    const found = await runSearch(await active(), "tirage", t);
    expect(found.groups.map((group) => group.id)).toEqual(["quiz.quizzes"]);
    expect(found.groups[0].results[0].url).toBe("/quiz/tirage-au-sort");
  });

  it("découpe la saisie et fabrique des extraits", () => {
    expect(searchWords("  L'Été, à   Paris !  a ")).toEqual(["ete", "paris"]);
    expect(searchWords("a")).toEqual([]);
    const text = `${"Début sans intérêt. ".repeat(20)}Le mot recherché est ici.${" Fin sans intérêt.".repeat(20)}`;
    const excerpt = excerptAround(text, ["recherche"]);
    expect(excerpt).toContain("recherché");
    expect(excerpt.length).toBeLessThan(180);
  });

  it("les recherches, y compris sans résultat, sont notées dans le journal", async () => {
    await recordActivity({ type: "search.query", userId: "u1", meta: { query: "ascenseur", results: 0 } });
    await recordActivity({ type: "search.query", userId: "u1", meta: { query: "budget", results: 3 } });
    const events = await db().activityEvent.findMany({ where: { type: "search.query" }, orderBy: { id: "asc" } });
    expect(events.map((event) => event.meta)).toEqual([{ query: "ascenseur", results: 0 }, { query: "budget", results: 3 }]);
    expect(events[0].actor).toBe(pseudonym("u1"));
  });
});

describe("liens de partage", () => {
  it("un contenu a un lien court stable, qui retrouve sa page", async () => {
    const id = await news("À partager");
    const code = await shareCodeFor("news.item", id);
    expect(await shareCodeFor("news.item", id)).toBe(code);
    expect(code).toMatch(/^[a-z0-9]{8}$/);
    expect(await resolveShareCode(code)).toMatchObject({ contentType: "news.item", contentId: id, url: "/actualites/a-partager", channel: "link" });
    expect(await resolveShareCode("inexistant")).toBeNull();
    // Un canal différent a son propre lien (pour mesurer chaque canal séparément).
    expect(await shareCodeFor("news.item", id, "autre-canal")).not.toBe(code);
  });

  it("le lien ne mène nulle part si le module est désactivé ou le contenu supprimé", async () => {
    await setModuleEnabled("knowledge", true);
    const id = await article("Fiche partagée");
    const code = await shareCodeFor("knowledge.article", id);
    await setModuleEnabled("knowledge", false);
    expect(await resolveShareCode(code)).toBeNull();
    await setModuleEnabled("knowledge", true);
    expect((await resolveShareCode(code))?.url).toBe("/articles/fiche-partagee");
    await db().article.delete({ where: { id } });
    expect(await resolveShareCode(code)).toBeNull();
  });

  it("retrouve un contenu à partir de l'adresse de sa page", async () => {
    const id = await news("Une page");
    expect(await findContentByPath("/actualites/une-page", allModules())).toEqual({ type: "news.item", id });
    expect(await findContentByPath("/actualites/inconnue", allModules())).toBeNull();
    expect(await findContentByPath("/actualites/une-page/sous-page", allModules())).toBeNull();
    expect(await findContentByPath("/admin/utilisateurs", allModules())).toBeNull();
  });
});

describe("aperçu d'un lien partagé", () => {
  beforeEach(async () => {
    await saveCommunity({ name: "Ma communauté d'essai", subtitle: "Sous-titre" });
  });

  it("montre le titre et le résumé du contenu quand le réglage le permet", async () => {
    await news("Assemblée du printemps", { summary: "Date et ordre du jour." });
    expect(await sharePreviewFor("/actualites/assemblee-du-printemps")).toEqual({ detailed: true, title: "Assemblée du printemps", description: "Date et ordre du jour.", communityName: "Ma communauté d'essai" });
  });

  it("reste neutre si la communauté l'a demandé", async () => {
    await news("Assemblée du printemps", { summary: "Confidentiel." });
    await saveCommunity({ settings: { activityRetentionMonths: 12, sharePreview: "neutral" } });
    const preview = await sharePreviewFor("/actualites/assemblee-du-printemps");
    expect(preview).toEqual({ detailed: false, title: "Ma communauté d'essai", description: "Sous-titre", communityName: "Ma communauté d'essai" });
    expect(JSON.stringify(preview)).not.toContain("Assemblée");
  });

  it("ne révèle jamais un contenu non publié, ni celui d'un module désactivé, ni une page d'administration", async () => {
    await news("Brouillon confidentiel", { status: "draft" });
    await setModuleEnabled("knowledge", true);
    await article("Fiche interne");
    await setModuleEnabled("knowledge", false);
    for (const path of ["/actualites/brouillon-confidentiel", "/articles/fiche-interne", "/admin/utilisateurs", "/actualites/inexistante"]) {
      expect((await sharePreviewFor(path)).detailed, path).toBe(false);
    }
  });
});

describe("mes données", () => {
  const PASSWORD = "mot-de-passe-de-test";
  const createUser = async (email: string, role = "reader") => (await db().user.create({ data: { email, name: `Nom de ${email}`, role, passwordHash: await hashPassword(PASSWORD) } })).id;

  async function withActivity(userId: string) {
    await importPack(await readPackDirectory("seed/packs/copropriete"));
    const quiz = await db().quiz.findFirstOrThrow({ where: { slug: "decouverte" } });
    const attemptId = await startAttempt(quiz.id, userId, "training");
    const view = await getAttemptView(attemptId, userId);
    if (view.phase === "question") await answerCurrentQuestion(attemptId, userId, [view.question.options[0].id]);
    const item = await db().newsItem.findFirstOrThrow();
    await markNewsRead(item.id, userId);
    await db().newsItem.update({ where: { id: item.id }, data: { authorId: userId } });
    await recordActivity({ type: "content.view", userId, contentType: "news.item", contentId: item.id });
    await db().group.create({ data: { name: "Bâtiment A", members: { create: { userId } } } });
    return { newsId: item.id };
  }

  it("l'export rassemble tout ce qui concerne la personne, et rien des autres", async () => {
    const me = await createUser("moi@exemple.test");
    const other = await createUser("autre@exemple.test");
    await withActivity(me);
    const quiz = await db().quiz.findFirstOrThrow({ where: { slug: "decouverte" } });
    await startAttempt(quiz.id, other, "evaluation");

    const data = await exportUserData(me);
    expect(data.account).toMatchObject({ email: "moi@exemple.test", role: "reader" });
    expect(data.groups).toEqual(["Bâtiment A"]);
    const modules = data.modules as Record<string, Record<string, unknown[]>>;
    expect(modules.quiz.attempts).toHaveLength(1);
    expect(modules.quiz.attempts[0]).toMatchObject({ mode: "training" });
    expect(modules.news.read).toHaveLength(1);
    expect(modules.news.authored).toHaveLength(1);
    // Les modules désactivés figurent aussi dans l'export : ils conservent leurs données.
    expect(Object.keys(modules).sort()).toEqual(["knowledge", "news", "quiz"]);
    const text = JSON.stringify(data);
    expect(text).not.toContain("autre@exemple.test");
    expect(text).not.toContain("passwordHash");
    expect(text).not.toMatch(/scrypt/);
  });

  it("supprimer son compte efface ses données et rend ses contenus anonymes", async () => {
    const me = await createUser("moi@exemple.test");
    await createUser("admin@exemple.test", "admin");
    const { newsId } = await withActivity(me);
    const session = await createSession(me);
    const actor = pseudonym(me);

    await expect(deleteOwnAccount(me, "mauvais-mot-de-passe")).rejects.toMatchObject({ reason: "wrong-password" });
    await deleteOwnAccount(me, PASSWORD);

    expect(await db().user.count({ where: { id: me } })).toBe(0);
    expect(await findSession(session.token)).toBeNull();
    expect(await db().quizAttempt.count({ where: { userId: me } })).toBe(0);
    expect(await db().quizAttemptAnswer.count()).toBe(0);
    expect(await db().newsRead.count({ where: { userId: me } })).toBe(0);
    expect(await db().groupMember.count({ where: { userId: me } })).toBe(0);
    // Le contenu rédigé reste, sans auteur.
    expect((await db().newsItem.findUniqueOrThrow({ where: { id: newsId } })).authorId).toBeNull();
    // Le journal garde l'événement sous pseudonyme : plus aucune table ne permet de le rattacher.
    expect(await db().activityEvent.count({ where: { actor } })).toBeGreaterThan(0);
    const everything = JSON.stringify([await db().activityEvent.findMany(), await db().user.findMany()]);
    expect(everything).not.toContain(me);
    expect(everything).not.toContain("moi@exemple.test");
  });

  it("le dernier administrateur ne peut pas supprimer son compte", async () => {
    const admin = await createUser("admin@exemple.test", "admin");
    await expect(deleteOwnAccount(admin, PASSWORD)).rejects.toMatchObject({ reason: "last-admin" });
    await createUser("second@exemple.test", "admin");
    await deleteOwnAccount(admin, PASSWORD);
    expect(await db().user.count()).toBe(1);
  });
});
