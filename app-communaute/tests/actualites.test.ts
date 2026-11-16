/**
 * ACTUALITÉS — états, visibilité, badge « Nouveau », épinglage, dates, fichiers de pack.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db/client";
import { fromDateTimeInput, toDateTimeInput } from "@/core/i18n/format";
import { parseFrontMatter, stringifyFrontMatter } from "@/core/pack/frontmatter";
import { translatorFor } from "@/core/community/translator";
import { checkNews, isVisibleToReaders, newsState, type NewsInput } from "@/modules/news/model";
import { newsPackSections } from "@/modules/news/pack";
import { deleteNews, listVisibleNews, markNewsRead, saveNews } from "@/modules/news/service";
import { resetDatabase } from "./support/database";

const HOUR = 60 * 60 * 1000;
const now = new Date("2026-06-15T12:00:00Z");
const at = (hours: number) => new Date(now.getTime() + hours * HOUR);
const input = (overrides: Partial<NewsInput> = {}): NewsInput => ({ title: "Titre", summary: "", content: "Texte", categoryId: null, status: "published", publishAt: at(-1), expiresAt: null, pinned: false, ...overrides });

describe("états d'une actualité", () => {
  it("se déduisent du statut et des dates", () => {
    expect(newsState({ status: "draft", publishAt: null, expiresAt: null }, now)).toBe("draft");
    expect(newsState({ status: "published", publishAt: at(-1), expiresAt: null }, now)).toBe("published");
    expect(newsState({ status: "published", publishAt: at(2), expiresAt: null }, now)).toBe("scheduled");
    expect(newsState({ status: "published", publishAt: at(-5), expiresAt: at(-1) }, now)).toBe("expired");
    expect(newsState({ status: "published", publishAt: at(-5), expiresAt: at(3) }, now)).toBe("published");
    expect(newsState({ status: "archived", publishAt: at(-5), expiresAt: null }, now)).toBe("archived");
  });

  it("une actualité programmée devient visible à l'heure dite, sans aucune intervention", () => {
    const scheduled = { status: "published", publishAt: at(2), expiresAt: at(10) };
    expect(isVisibleToReaders(scheduled, now)).toBe(false);
    expect(isVisibleToReaders(scheduled, at(3))).toBe(true);
    expect(isVisibleToReaders(scheduled, at(11))).toBe(false);
  });

  it("contrôle la saisie", () => {
    expect(checkNews(input())).toEqual([]);
    expect(checkNews(input({ title: " " })).map((issue) => issue.key)).toEqual(["news.error.title"]);
    expect(checkNews(input({ publishAt: at(5), expiresAt: at(1) })).map((issue) => issue.key)).toEqual(["news.error.expiry"]);
  });
});

describe("liste des actualités", () => {
  beforeEach(resetDatabase);

  it("ne montre aux lecteurs que les actualités publiées, parues et non expirées", async () => {
    await saveNews(null, input({ title: "Visible" }));
    await saveNews(null, input({ title: "Brouillon", status: "draft" }));
    await saveNews(null, input({ title: "Programmée", publishAt: at(5) }));
    await saveNews(null, input({ title: "Expirée", publishAt: at(-10), expiresAt: at(-1) }));
    await saveNews(null, input({ title: "Archivée", status: "archived" }));
    expect((await listVisibleNews("u1", {}, now)).map((item) => item.title)).toEqual(["Visible"]);
    // Cinq heures plus tard, la programmée est parue.
    expect((await listVisibleNews("u1", {}, at(6))).map((item) => item.title)).toEqual(["Programmée", "Visible"]);
  });

  it("place les épinglées en tête, puis trie de la plus récente à la plus ancienne", async () => {
    await saveNews(null, input({ title: "Ancienne", publishAt: at(-30) }));
    await saveNews(null, input({ title: "Récente", publishAt: at(-1) }));
    await saveNews(null, input({ title: "Épinglée ancienne", publishAt: at(-50), pinned: true }));
    expect((await listVisibleNews("u1", {}, now)).map((item) => item.title)).toEqual(["Épinglée ancienne", "Récente", "Ancienne"]);
  });

  it("le badge « Nouveau » disparaît pour la personne qui a lu, et pour elle seule", async () => {
    const id = await saveNews(null, input({ title: "À lire" }));
    expect((await listVisibleNews("u1", {}, now))[0].isNew).toBe(true);
    await markNewsRead(id, "u1");
    await markNewsRead(id, "u1"); // relire ne pose aucun problème
    expect((await listVisibleNews("u1", {}, now))[0].isNew).toBe(false);
    expect((await listVisibleNews("u2", {}, now))[0].isNew).toBe(true);
  });

  it("filtre par catégorie, sous-catégories comprises", async () => {
    const parent = await db().category.create({ data: { path: "a", name: "A" } });
    const child = await db().category.create({ data: { path: "a/b", name: "B", parentId: parent.id } });
    const other = await db().category.create({ data: { path: "c", name: "C" } });
    await saveNews(null, input({ title: "Dans le parent", categoryId: parent.id }));
    await saveNews(null, input({ title: "Dans l'enfant", categoryId: child.id }));
    await saveNews(null, input({ title: "Ailleurs", categoryId: other.id }));
    expect((await listVisibleNews("u1", { categoryId: parent.id }, now)).map((item) => item.title).sort()).toEqual(["Dans l'enfant", "Dans le parent"]);
    expect((await listVisibleNews("u1", { categoryId: child.id }, now)).map((item) => item.title)).toEqual(["Dans l'enfant"]);
  });

  it("publier sans date publie tout de suite ; l'adresse ne change pas quand le titre change", async () => {
    const id = await saveNews(null, input({ title: "Réunion d'été", publishAt: null }));
    const created = await db().newsItem.findUniqueOrThrow({ where: { id } });
    expect(created.slug).toBe("reunion-d-ete");
    expect(created.publishAt).not.toBeNull();

    await saveNews(id, input({ title: "Réunion d'automne", publishAt: null }));
    const updated = await db().newsItem.findUniqueOrThrow({ where: { id } });
    expect(updated.slug).toBe("reunion-d-ete");
    expect(updated.publishAt?.getTime()).toBe(created.publishAt?.getTime());

    // Un second contenu de même titre reçoit une adresse distincte.
    const second = await saveNews(null, input({ title: "Réunion d'été" }));
    expect((await db().newsItem.findUniqueOrThrow({ where: { id: second } })).slug).toBe("reunion-d-ete-2");
  });

  it("vider la date d'une actualité programmée la publie tout de suite", async () => {
    const id = await saveNews(null, input({ publishAt: new Date(Date.now() + 48 * HOUR) }));
    expect(await listVisibleNews("u1")).toHaveLength(0);
    await saveNews(id, input({ publishAt: null }));
    expect(await listVisibleNews("u1")).toHaveLength(1);
  });

  it("supprimer une actualité supprime aussi ses marques de lecture", async () => {
    const id = await saveNews(null, input());
    await markNewsRead(id, "u1");
    await deleteNews(id);
    expect(await db().newsRead.count()).toBe(0);
  });
});

describe("dates des formulaires", () => {
  it("sont interprétées à l'heure de Paris, été comme hiver", () => {
    expect(fromDateTimeInput("2026-01-15T09:30")?.toISOString()).toBe("2026-01-15T08:30:00.000Z"); // heure d'hiver
    expect(fromDateTimeInput("2026-07-15T09:30")?.toISOString()).toBe("2026-07-15T07:30:00.000Z"); // heure d'été
    expect(fromDateTimeInput("")).toBeNull();
    expect(fromDateTimeInput("n'importe quoi")).toBeNull();
  });

  it("font l'aller-retour sans décalage", () => {
    for (const value of ["2026-01-15T09:30", "2026-07-15T23:05", "2026-03-29T12:00", "2026-10-25T12:00"]) {
      expect(toDateTimeInput(fromDateTimeInput(value))).toBe(value);
    }
    expect(toDateTimeInput(null)).toBe("");
  });
});

describe("fichiers Markdown avec en-tête", () => {
  it("font l'aller-retour", () => {
    const text = stringifyFrontMatter({ title: "Titre : avec deux-points", pinned: true, tags: ["a", "b"], vide: "", absent: undefined }, "Corps\n\n- liste");
    const parsed = parseFrontMatter(text);
    expect(parsed.data).toEqual({ title: "Titre : avec deux-points", pinned: true, tags: ["a", "b"] });
    expect(parsed.body).toBe("Corps\n\n- liste");
  });

  it("acceptent un fichier sans en-tête et signalent un en-tête illisible", () => {
    expect(parseFrontMatter("Juste du texte")).toEqual({ data: {}, body: "Juste du texte" });
    expect(parseFrontMatter("---\ntitle: [non fermé\n---\nCorps").error).toBeTruthy();
  });
});

describe("section de pack « actualités »", () => {
  beforeEach(resetDatabase);
  const section = newsPackSections[0];
  const t = translatorFor({ vocabulary: {} });
  const files = (entries: Record<string, string>) => new Map(Object.entries(entries).map(([path, text]) => [path, Buffer.from(text)]));

  it("importe, puis exporte à l'identique", async () => {
    const original = files({
      "news/premiere.md": "---\ntitle: Première\nsummary: Résumé\nstatus: published\npublishAt: 2026-05-01T08:00:00.000Z\npinned: true\n---\n\nCorps **riche**\n",
      "news/brouillon.md": "---\ntitle: Brouillon\nstatus: draft\n---\n\nÀ finir\n",
      "autre/ignore.md": "---\ntitle: Hors section\n---\n",
    });
    const report = await section.import(original, { t });
    expect(report).toMatchObject({ created: 2, updated: 0, unchanged: 0, warnings: [] });

    const exported = await section.export();
    expect([...exported.keys()]).toEqual(["news/brouillon.md", "news/premiere.md"]);
    const again = await section.import(new Map([...exported].map(([path, content]) => [path, Buffer.from(content)])), { t });
    expect(again).toMatchObject({ created: 0, updated: 0, unchanged: 2 });
    expect(parseFrontMatter(String(exported.get("news/premiere.md"))).data).toMatchObject({ title: "Première", pinned: true, publishAt: "2026-05-01T08:00:00.000Z" });
  });

  it("signale précisément un fichier invalide, et importe les autres", async () => {
    const report = await section.import(
      files({
        "news/valide.md": "---\ntitle: Valide\n---\nTexte",
        "news/sans-titre.md": "---\nstatus: published\n---\nTexte",
        "news/date-fausse.md": "---\ntitle: Date\npublishAt: pas une date\n---\nTexte",
        "news/statut-faux.md": "---\ntitle: Statut\nstatus: en-ligne\n---\nTexte",
      }),
      { t },
    );
    expect(report.created).toBe(1);
    expect(report.warnings.some((warning) => warning.startsWith("news/sans-titre.md") && warning.includes("titre"))).toBe(true);
    expect(report.warnings.some((warning) => warning.startsWith("news/date-fausse.md") && warning.includes("pas une date"))).toBe(true);
    expect(report.warnings.some((warning) => warning.startsWith("news/statut-faux.md"))).toBe(true);
  });

  it("un pack sans dossier news/ est valide", async () => {
    expect(await section.import(files({ "questions.json": "[]" }), { t })).toMatchObject({ created: 0, updated: 0, unchanged: 0, warnings: [] });
    expect((await section.export()).size).toBe(0);
  });
});
