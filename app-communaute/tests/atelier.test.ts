/**
 * ATELIER — export et import de pack (.zip), imports en masse, catégories.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createInvitedUser } from "@/core/auth/users";
import { recordActivity } from "@/core/activity/log";
import { createSession } from "@/core/auth/sessions";
import { listCategories, saveCategoryTree } from "@/core/categories/service";
import { loadCommunity } from "@/core/community/service";
import { translatorFor } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { buildCsv, decodeText, parseCsv } from "@/core/import/files";
import { activeModules, allModules, importFormatsFor } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";
import type { ImportContext, UploadedFile } from "@/core/modules/types";
import { exportPack } from "@/core/pack/export";
import { importPack } from "@/core/pack/import";
import { readPackDirectory } from "@/core/pack/read-directory";
import { PackError } from "@/core/pack/schema";
import { readPackZip, writeZip } from "@/core/pack/zip";
import { saveMedia } from "@/core/media/service";
import { articlesImportFormat } from "@/modules/knowledge/import";
import { markNewsRead } from "@/modules/news/service";
import { questionsImportFormat } from "@/modules/quiz/import";
import { answerCurrentQuestion, getAttemptView, startAttempt } from "@/modules/quiz/service";
import { resetDatabase } from "./support/database";

const example = (name: string) => readPackDirectory(`seed/packs/${name}`);
const toText = (content: string | Buffer) => (typeof content === "string" ? content : content.toString("latin1"));

/** Exporte la communauté et renvoie ses fichiers, date d'export neutralisée pour pouvoir comparer. */
async function exportedFiles() {
  const files = await exportPack({ includeContents: true, now: new Date("2026-01-01T00:00:00Z") });
  return new Map([...files].map(([path, content]) => [path, toText(content)]));
}

beforeEach(resetDatabase);

describe.each(["peopledoc", "copropriete"])("export puis import du pack « %s »", (name) => {
  it("redonne une communauté identique, dans une installation vierge", async () => {
    await importPack(await example(name));
    const original = await exportedFiles();
    const archive = writeZip(await exportPack({ includeContents: true, now: new Date("2026-01-01T00:00:00Z") }));

    // Nouvelle installation, vide.
    await resetDatabase();
    const report = await importPack(readPackZip(archive));
    expect(report.warnings).toEqual([]);

    const copy = await exportedFiles();
    expect([...copy.keys()].sort()).toEqual([...original.keys()].sort());
    for (const [path, content] of original) expect(copy.get(path), path).toBe(content);
  });

  it("le pack ne contient aucune donnée personnelle", async () => {
    await importPack(await example(name));
    // On crée de l'activité personnelle : comptes, session, résultat de quiz, lecture, journal.
    const { userId } = await createInvitedUser({ name: "Zoé Confidentielle", email: "zoe.confidentielle@exemple.test", role: "editor" });
    await createSession(userId);
    const quiz = await db().quiz.findFirstOrThrow({ where: { status: "published" } });
    const attemptId = await startAttempt(quiz.id, userId, "evaluation");
    const view = await getAttemptView(attemptId, userId);
    if (view.phase === "question") await answerCurrentQuestion(attemptId, userId, [view.question.options[0].id]);
    const news = await db().newsItem.findFirstOrThrow();
    await db().newsItem.update({ where: { id: news.id }, data: { authorId: userId } });
    await markNewsRead(news.id, userId);
    await recordActivity({ type: "content.view", userId, contentType: "news.item", contentId: news.id });
    await db().group.create({ data: { name: "Groupe secret", members: { create: { userId } } } });

    const everything = [...(await exportedFiles()).values()].join("\n");
    for (const secret of ["Zoé", "Confidentielle", "zoe.confidentielle", userId, attemptId, "Groupe secret", "passwordHash", "authorId"]) {
      expect(everything.includes(secret), `le pack contient « ${secret} »`).toBe(false);
    }
    expect([...(await exportedFiles()).keys()].filter((path) => !/^(pack\.json|questions\.json|quizzes\.json|news\/|articles\/|media\/)/.test(path))).toEqual([]);
  });
});

describe("contenu des packs", () => {
  it("un pack sans base de connaissance n'a pas de dossier articles/ ; un pack avec en a un", async () => {
    await importPack(await example("copropriete"));
    expect([...(await exportedFiles()).keys()].some((path) => path.startsWith("articles/"))).toBe(false);
    await resetDatabase();
    await importPack(await example("peopledoc"));
    expect([...(await exportedFiles()).keys()].filter((path) => path.startsWith("articles/"))).toHaveLength(3);
  });

  it("« configuration seule » : ni contenus, ni images hors logo et favicon", async () => {
    await importPack(await example("peopledoc"));
    await saveMedia({ filename: "photo.png", data: Buffer.from("image-de-contenu") });
    const config = await exportPack({ includeContents: false });
    expect([...config.keys()].sort()).toEqual(["media/index.json", "media/logo.svg", "pack.json"]);
    const full = await exportPack({ includeContents: true });
    expect([...full.keys()].filter((path) => path.startsWith("media/")).length).toBe(3); // index, logo, photo
  });

  it("une image de contenu garde son adresse après export puis import", async () => {
    await importPack(await example("copropriete"));
    const saved = await saveMedia({ filename: "plan.png", data: Buffer.from("contenu-de-l-image"), alt: "Plan du hall" });
    const archive = writeZip(await exportPack({ includeContents: true }));
    await resetDatabase();
    const report = await importPack(readPackZip(archive));
    expect(report.media.created).toBe(2);
    const media = await db().media.findUniqueOrThrow({ where: { storageKey: saved.storageKey } });
    expect(media).toMatchObject({ filename: "plan.png", alt: "Plan du hall", isPublic: false });
    // Réimporter ne duplique rien.
    expect((await importPack(readPackZip(archive))).media).toEqual({ created: 0, updated: 0, unchanged: 2 });
  });

  it("refuse un fichier qui n'est pas un pack, avec un message clair", () => {
    expect(() => readPackZip(Buffer.from("pas un zip"))).toThrow(PackError);
    expect(() => readPackZip(writeZip(new Map([["autre.txt", "x"]])))).toThrow(/pack\.json/);
  });

  it("accepte un pack rangé dans un dossier à l'intérieur du .zip", () => {
    const pack = readPackZip(writeZip(new Map([["mon-pack/pack.json", JSON.stringify({ formatVersion: 1, identity: { name: "Essai" } })], ["mon-pack/questions.json", "[]"]])));
    expect(pack.manifest.identity.name).toBe("Essai");
    expect([...pack.files.keys()]).toEqual(["questions.json"]);
  });

  it("mettre à jour une communauté par un pack ne supprime aucun contenu existant", async () => {
    await importPack(await example("copropriete"));
    await db().newsItem.create({ data: { slug: "ajout-local", title: "Ajout local" } });
    const report = await importPack(await example("copropriete"));
    expect(report.sections.every((section) => section.created === 0 && section.updated === 0)).toBe(true);
    expect(await db().newsItem.count()).toBe(3);
  });
});

describe("import en masse de questions", () => {
  const file = (name: string, content: string | Buffer): UploadedFile => ({ name, data: typeof content === "string" ? Buffer.from(content) : content });
  const contextFor = async (): Promise<ImportContext> => ({ t: translatorFor(await loadCommunity()), active: activeModules(await readModuleStates()) });

  const HEADER = "ref;type;enonce;reponse_1;reponse_2;reponse_3;bonnes_reponses;explication;difficulte;categorie";
  const VALID = [
    "q-a;unique;Question A ?;Oui;Non;;1;Parce que.;1;travaux",
    "q-b;multiple;Question B ?;Un;Deux;Trois;1,3;;2;",
    "q-c;vrai_faux;Affirmation C.;;;;faux;;3;",
  ];

  it("un fichier conforme sans colonne « article lié » s'importe sans erreur", async () => {
    await importPack(await example("copropriete"));
    const context = await contextFor();
    const files = [file("questions.csv", [HEADER, ...VALID].join("\n"))];
    const preview = await questionsImportFormat.preview(files, context);
    expect(preview.warnings).toEqual([]);
    expect(preview.rows.map((row) => row.status)).toEqual(["ok", "ok", "ok"]);
    expect(preview.rows.map((row) => row.cells[0])).toEqual(["2", "3", "4"]); // numéros de ligne du fichier

    const result = await questionsImportFormat.commit(files, new Set(), context);
    expect(result).toMatchObject({ created: 3, updated: 0, warnings: [] });
    const c = await db().question.findUniqueOrThrow({ where: { ref: "q-c" }, include: { options: { orderBy: { position: "asc" } } } });
    expect(c).toMatchObject({ type: "truefalse", difficulty: 3 });
    expect(c.options.map((option) => option.isCorrect)).toEqual([false, true]);
    const b = await db().question.findUniqueOrThrow({ where: { ref: "q-b" }, include: { options: { orderBy: { position: "asc" } } } });
    expect(b.options.map((option) => option.isCorrect)).toEqual([true, false, true]);
    expect((await db().question.findUniqueOrThrow({ where: { ref: "q-a" } })).categoryId).not.toBeNull();
  });

  it("avec la colonne « article lié » et la base de connaissance active : les liens sont créés", async () => {
    await importPack(await example("peopledoc"));
    const context = await contextFor();
    const files = [file("questions.csv", [`${HEADER};article_lie`, "q-lien;unique;Question liée ?;Oui;Non;;1;;1;;premiers-pas", "q-faux-lien;unique;Autre ?;Oui;Non;;1;;1;;article-inexistant"].join("\n"))];
    const preview = await questionsImportFormat.preview(files, context);
    expect(preview.rows.map((row) => row.status)).toEqual(["ok", "warning"]);
    expect(preview.rows[1].messages[0]).toMatch(/Ligne 3.*article-inexistant/);

    await questionsImportFormat.commit(files, new Set(), context);
    const linked = await db().question.findUniqueOrThrow({ where: { ref: "q-lien" } });
    const links = await db().contentLink.findMany({ where: { fromType: "quiz.question", fromId: linked.id } });
    expect(links).toHaveLength(1);
    expect((await db().article.findUniqueOrThrow({ where: { id: links[0].toId } })).slug).toBe("premiers-pas");
    // La question au lien introuvable est importée quand même, sans lien.
    expect(await db().question.count({ where: { ref: "q-faux-lien" } })).toBe(1);
  });

  it("sans base de connaissance : la colonne « article lié » est ignorée, rien ne casse", async () => {
    await importPack(await example("copropriete"));
    const context = await contextFor();
    const files = [file("questions.csv", [`${HEADER};article_lie`, "q-x;unique;Question ?;Oui;Non;;1;;1;;un-article"].join("\n"))];
    const preview = await questionsImportFormat.preview(files, context);
    expect(preview.rows[0].status).toBe("ok");
    const result = await questionsImportFormat.commit(files, new Set(), context);
    expect(result.created).toBe(1);
    expect(await db().contentLink.count()).toBe(0);
    // Le modèle proposé au téléchargement n'a pas cette colonne non plus.
    expect(questionsImportFormat.templates[0].build(context)).not.toContain("article_lie");
    expect(questionsImportFormat.templates[1].build(context)).not.toContain("knowledge");
    // …et l'import d'articles n'existe tout simplement pas pour cette communauté.
    expect(importFormatsFor(context.active).map((format) => format.id)).toEqual(["quiz.questions"]);
  });

  it("un fichier non conforme renvoie un message clair qui indique la ligne fautive", async () => {
    const context = await contextFor();
    const files = [
      file(
        "questions.csv",
        [HEADER, VALID[0].replace(";travaux", ";"), "q-2;unique;;Oui;Non;;1;;1;", "q-3;unique;Deux bonnes ?;Oui;Non;;1,2;;1;", "q-4;vrai_faux;Sans réponse.;;;;peut-être;;1;", "q-5;inconnu;Type faux ?;Oui;Non;;1;;1;", "q-6;unique;Difficulté ?;Oui;Non;;1;;9;"].join("\n"),
      ),
    ];
    const preview = await questionsImportFormat.preview(files, context);
    expect(preview.rows.map((row) => row.status)).toEqual(["ok", "error", "error", "error", "error", "error"]);
    expect(preview.rows[1].messages).toEqual(["Ligne 3 : L'énoncé est obligatoire."]);
    expect(preview.rows[2].messages[0]).toMatch(/^Ligne 4 : .*exactement une bonne réponse/);
    expect(preview.rows[3].messages[0]).toMatch(/^Ligne 5 : .*vrai.*faux/);
    expect(preview.rows[4].messages[0]).toMatch(/^Ligne 6 : Type inconnu/);
    expect(preview.rows[5].messages[0]).toMatch(/^Ligne 7 : La difficulté/);

    // Les lignes refusées ne sont pas importées ; une ligne valide peut être exclue à la main.
    expect((await questionsImportFormat.commit(files, new Set(), context)).created).toBe(1);
    await db().question.deleteMany();
    expect((await questionsImportFormat.commit(files, new Set(["questions.csv:2"]), context)).created).toBe(0);
  });

  it("signale une colonne obligatoire absente et les colonnes inconnues", async () => {
    const context = await contextFor();
    const missing = await questionsImportFormat.preview([file("q.csv", "ref;type;reponse_1\nq-1;unique;Oui")], context);
    expect(missing.rows).toEqual([]);
    expect(missing.warnings[0]).toMatch(/colonne obligatoire absente : « enonce »/);
    const extra = await questionsImportFormat.preview([file("q.csv", "type;enonce;reponse_1;reponse_2;bonnes_reponses;commentaire\nunique;Q ?;A;B;2;à revoir")], context);
    expect(extra.rows[0].status).toBe("ok");
    expect(extra.warnings[0]).toMatch(/ignorées : commentaire/);
  });

  it("lit les fichiers d'un tableur : séparateur virgule ou point-virgule, accents en Windows-1252, titres accentués", async () => {
    const context = await contextFor();
    const latin1 = Buffer.from("Type;Énoncé;Réponse 1;Réponse 2;Bonnes réponses\nunique;Où est l'été ?;Ici;Là-bas;2\n", "latin1");
    expect(decodeText(latin1)).toContain("Où est l'été ?");
    const preview = await questionsImportFormat.preview([file("tableur.csv", latin1)], context);
    expect(preview.rows[0]).toMatchObject({ status: "ok" });
    expect(preview.rows[0].cells[1]).toBe("Où est l'été ?");
    const comma = parseCsv('type,enonce\nunique,"Avec, une virgule"\n');
    expect(comma.rows[0].values.enonce).toBe("Avec, une virgule");
  });

  it("réimporter le même fichier met à jour au lieu de dupliquer", async () => {
    const context = await contextFor();
    const files = [file("questions.csv", [HEADER, ...VALID.map((line) => line.replace(";travaux", ";"))].join("\n"))];
    await questionsImportFormat.commit(files, new Set(), context);
    const again = await questionsImportFormat.preview(files, context);
    expect(again.rows.every((row) => row.cells.at(-1) === "Mise à jour")).toBe(true);
    expect(await questionsImportFormat.commit(files, new Set(), context)).toMatchObject({ created: 0, updated: 0, unchanged: 3 });
    expect(await db().question.count()).toBe(3);
  });

  it("les modèles téléchargeables s'importent tels quels", async () => {
    const context: ImportContext = { t: translatorFor({ vocabulary: {} }), active: allModules() };
    for (const template of questionsImportFormat.templates) {
      const preview = await questionsImportFormat.preview([file(template.filename, template.build(context))], context);
      expect(preview.warnings, template.filename).toEqual([]);
      // Le modèle JSON montre un lien fictif : sa ligne est « à vérifier », jamais refusée.
      expect(preview.rows).toHaveLength(3);
      expect(preview.rows.map((row) => row.status), template.filename).not.toContain("error");
    }
    expect(questionsImportFormat.templates[0].build(context)).toContain("article_lie");
  });

  it("importe aussi un fichier JSON", async () => {
    const context = await contextFor();
    const json = JSON.stringify([{ type: "truefalse", statement: "Affirmation", answer: true }, { type: "single", statement: "" }]);
    const preview = await questionsImportFormat.preview([file("questions.json", json)], context);
    expect(preview.rows.map((row) => row.status)).toEqual(["ok", "error"]);
    expect(preview.rows[1].messages[0]).toMatch(/^Ligne 2 : /);
    expect((await questionsImportFormat.preview([file("questions.json", "{ pas du json")], context)).warnings[0]).toMatch(/illisible/);
  });
});

describe("import en masse d'articles", () => {
  it("prévisualise chaque fichier, puis crée ou met à jour", async () => {
    const context: ImportContext = { t: translatorFor({ vocabulary: {} }), active: allModules() };
    const files: UploadedFile[] = [
      { name: "Guide de Démarrage.md", data: Buffer.from("---\ntitle: Guide\nstatus: published\ntags: [aide]\n---\nTexte") },
      { name: "sans-titre.md", data: Buffer.from("---\nstatus: draft\n---\nTexte") },
      { name: "image.png", data: Buffer.from("x") },
    ];
    const preview = await articlesImportFormat.preview(files, context);
    expect(preview.rows.map((row) => [row.cells[0], row.status])).toEqual([["Guide de Démarrage.md", "ok"], ["sans-titre.md", "error"]]);
    expect(preview.rows[1].messages[0]).toMatch(/^sans-titre\.md : Le titre est obligatoire/);
    expect(preview.warnings[0]).toMatch(/image\.png/);

    expect(await articlesImportFormat.commit(files, new Set(), context)).toMatchObject({ created: 1, updated: 0 });
    expect((await db().article.findUniqueOrThrow({ where: { slug: "guide-de-demarrage" } })).title).toBe("Guide");
    expect((await articlesImportFormat.preview(files, context)).rows[0].cells.at(-1)).toBe("Mise à jour");
    // Le modèle fourni est lui-même importable.
    const template = articlesImportFormat.templates[0];
    expect((await articlesImportFormat.preview([{ name: template.filename, data: Buffer.from(template.build(context)) }], context)).rows[0].status).toBe("ok");
  });
});

describe("fichiers pour tableur", () => {
  it("le modèle produit se relit à l'identique", () => {
    const csv = buildCsv(["type", "enonce"], [["unique", "Un ; point-virgule et des \"guillemets\""]]);
    const table = parseCsv(decodeText(Buffer.from(csv)));
    expect(table.headers).toEqual(["type", "enonce"]);
    expect(table.rows[0].values.enonce).toBe('Un ; point-virgule et des "guillemets"');
  });
});

describe("éditeur de catégories", () => {
  it("crée, renomme, réordonne, déplace et supprime, en gardant des identifiants stables", async () => {
    await saveCategoryTree([{ name: "Travaux", children: [{ name: "Toiture" }, { name: "Façade" }] }, { name: "Budget", children: [] }]);
    let categories = await listCategories();
    expect(categories.map((category) => category.path)).toEqual(["travaux", "travaux/toiture", "travaux/facade", "budget"]);
    const id = (path: string) => categories.find((category) => category.path === path)!.id;

    // Renommer ne change pas l'identifiant stable ; réordonner et déplacer une sous-catégorie.
    await saveCategoryTree([
      { id: id("budget"), name: "Charges et budget", children: [{ id: id("travaux/facade"), name: "Façade" }] },
      { id: id("travaux"), name: "Gros travaux", children: [{ id: id("travaux/toiture"), name: "Toiture" }, { name: "Ascenseur" }] },
    ]);
    categories = await listCategories();
    expect(categories.map((category) => [category.path, category.label])).toEqual([
      ["budget", "Charges et budget"],
      ["budget/facade", "Charges et budget › Façade"],
      ["travaux", "Gros travaux"],
      ["travaux/toiture", "Gros travaux › Toiture"],
      ["travaux/ascenseur", "Gros travaux › Ascenseur"],
    ]);

    // Supprimer une catégorie supprime ses sous-catégories, pas les contenus.
    const news = await db().newsItem.create({ data: { slug: "n", title: "N", categoryId: id("travaux/toiture") } });
    await saveCategoryTree([{ id: id("budget"), name: "Charges et budget", children: [] }]);
    expect((await listCategories()).map((category) => category.path)).toEqual(["budget"]);
    expect(await db().newsItem.count({ where: { id: news.id } })).toBe(1);
  });

  it("deux catégories de même nom reçoivent des identifiants distincts", async () => {
    await saveCategoryTree([{ name: "Divers", children: [] }, { name: "Divers", children: [] }]);
    expect((await listCategories()).map((category) => category.path)).toEqual(["divers", "divers-2"]);
  });
});
