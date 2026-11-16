/**
 * PACKS — chargement de la configuration d'une communauté depuis un pack, avec les
 * deux exemples fournis.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { loadCommunity } from "@/core/community/service";
import { translatorFor } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { readMedia } from "@/core/media/service";
import { activeModules, adminScreensFor, homeBlocksFor, navigationFor } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";
import { applyPackConfig } from "@/core/pack/apply-config";
import { importPack } from "@/core/pack/import";
import { readPackDirectory } from "@/core/pack/read-directory";
import { PackError, parsePackManifest, type Pack } from "@/core/pack/schema";
import { resetDatabase } from "./support/database";

const example = (name: string) => readPackDirectory(path.join("seed/packs", name));

beforeEach(resetDatabase);

describe("pack d'exemple sans base de connaissance", () => {
  it("donne une communauté complète, sans aucune trace des articles", async () => {
    const { warnings } = await applyPackConfig(await example("copropriete"));
    expect(warnings).toEqual([]);

    const community = await loadCommunity();
    const active = activeModules(await readModuleStates());
    const t = translatorFor(community);

    expect(active.map((module) => module.key).sort()).toEqual(["news", "quiz"]);
    // Menu, accueil et administration : tels qu'un lecteur et un administrateur les voient.
    expect(navigationFor(active).map((entry) => t(entry.labelKey))).toEqual(["Accueil", "Infos syndic", "Quiz"]);
    expect(homeBlocksFor(active, community.home.blocks).map((block) => block.id)).toEqual(["quiz.featured", "news.latest"]);
    const screens = adminScreensFor(active, "admin").map((screen) => `${t(screen.labelKey)} ${screen.href}`);
    expect(screens.join(" | ")).not.toMatch(/article|knowledge|fiche/i);

    // Le module désactivé est bien enregistré (désactivé), prêt à être activé plus tard.
    expect((await readModuleStates()).get("knowledge")).toBe(false);
  });
});

describe("les deux exemples", () => {
  it("donnent deux communautés différentes avec le même code", async () => {
    await applyPackConfig(await example("peopledoc"));
    const first = await loadCommunity();
    const firstActive = activeModules(await readModuleStates());
    const firstMenu = navigationFor(firstActive).map((entry) => translatorFor(first)(entry.labelKey));

    await resetDatabase();
    await applyPackConfig(await example("copropriete"));
    const second = await loadCommunity();
    const secondMenu = navigationFor(activeModules(await readModuleStates())).map((entry) => translatorFor(second)(entry.labelKey));

    expect(first.name).not.toBe(second.name);
    expect(first.theme.colors.primary).not.toBe(second.theme.colors.primary);
    expect(first.theme.font).not.toBe(second.theme.font);
    expect(firstMenu).toEqual(["Accueil", "Actualités", "Quiz", "Fiches"]);
    expect(secondMenu).toEqual(["Accueil", "Infos syndic", "Quiz"]);
    expect(first.settings.activityRetentionMonths).toBe(12);
    expect(second.settings.activityRetentionMonths).toBe(6);
  });

  it("portent la mention de contenu d'exemple", async () => {
    for (const name of ["peopledoc", "copropriete"]) {
      const pack = await example(name);
      expect(pack.manifest.home?.welcomeText.startsWith("[CONTENU D'EXEMPLE — À VALIDER]")).toBe(true);
    }
  });

  it("chargent le logo et des catégories sur deux niveaux au maximum", async () => {
    await applyPackConfig(await example("peopledoc"));
    const community = await loadCommunity();
    const logo = await readMedia(community.logoMediaId!);
    expect(logo?.mimeType).toBe("image/svg+xml");
    expect(logo?.isPublic).toBe(true);

    const categories = await db().category.findMany({ include: { parent: true } });
    expect(categories.length).toBeGreaterThan(3);
    expect(categories.every((category) => !category.parent?.parentId)).toBe(true);
    expect(categories.map((category) => category.path)).toContain("gestion-documentaire/classement");
  });

  it("peuvent être rechargés sans créer de doublons", async () => {
    await applyPackConfig(await example("peopledoc"));
    const counts = async () => ({
      categories: await db().category.count(),
      modules: await db().moduleState.count(),
      medias: await db().media.count(),
    });
    const before = await counts();
    await applyPackConfig(await example("peopledoc"));
    expect(await counts()).toEqual(before);
  });
});

describe("contenus d'un pack", () => {
  it("chaque exemple contient 10 questions et 2 quiz, tous marqués comme contenu d'exemple", async () => {
    for (const name of ["peopledoc", "copropriete"]) {
      await resetDatabase();
      const report = await importPack(await example(name));
      expect(report.sections.find((section) => section.id === "quiz.questions")?.created).toBe(10);
      expect(report.sections.find((section) => section.id === "quiz.quizzes")?.created).toBe(2);
      expect(report.sections.find((section) => section.id === "news.items")?.created).toBe(2);
      expect(report.warnings).toEqual([]);

      const news = await db().newsItem.findMany();
      expect(news.every((item) => item.title.startsWith("[CONTENU D'EXEMPLE — À VALIDER]") && item.content.startsWith("[CONTENU D'EXEMPLE — À VALIDER]"))).toBe(true);
      expect(news.filter((item) => item.pinned)).toHaveLength(1);

      const questions = await db().question.findMany({ include: { options: true } });
      expect(questions.every((question) => question.statement.startsWith("[CONTENU D'EXEMPLE — À VALIDER]"))).toBe(true);
      expect(questions.every((question) => question.categoryId !== null)).toBe(true);
      expect(new Set(questions.map((question) => question.type))).toEqual(new Set(["single", "multiple", "truefalse"]));
      expect((await db().quiz.findMany()).every((quiz) => quiz.title.startsWith("[CONTENU D'EXEMPLE — À VALIDER]"))).toBe(true);
    }
  });

  it("réimporter le même pack ne crée ni doublon ni modification", async () => {
    await importPack(await example("copropriete"));
    const again = await importPack(await example("copropriete"));
    for (const section of again.sections) expect(section).toMatchObject({ created: 0, updated: 0 });
    expect(again.sections.find((section) => section.id === "quiz.questions")?.unchanged).toBe(10);
    expect(await db().question.count()).toBe(10);
    expect(await db().quiz.count()).toBe(2);
    expect(await db().newsItem.count()).toBe(2);
  });

  it("une simulation d'import décrit ce qui serait fait, sans rien modifier", async () => {
    const report = await importPack(await example("peopledoc"), { dryRun: true });
    expect(report.sections.find((section) => section.id === "quiz.questions")?.created).toBe(10);
    expect((await loadCommunity()).exists).toBe(false);
    expect(await db().question.count()).toBe(0);
    expect(await db().category.count()).toBe(0);
    expect(await db().media.count()).toBe(0);
  });

  it("les contenus d'un module désactivé sont importés mais signalés comme masqués", async () => {
    const pack = await example("copropriete");
    pack.manifest.modules.quiz = { enabled: false, settings: {} };
    const report = await importPack(pack);
    expect(await db().question.count()).toBe(10);
    expect(report.warnings.some((warning) => warning.includes("Quiz") && warning.includes("masqués"))).toBe(true);
    expect(activeModules(await readModuleStates()).map((module) => module.key)).toEqual(["news"]);
  });

  it("une question invalide est signalée avec sa position, les autres sont importées", async () => {
    const pack = await example("copropriete");
    const questions = JSON.parse(pack.files.get("questions.json")!.toString("utf8"));
    questions[2] = { ref: "q-003", type: "single", statement: "", options: [] };
    questions[4].category = "categorie/inconnue";
    pack.files.set("questions.json", Buffer.from(JSON.stringify(questions)));
    const report = await importPack(pack);
    expect(await db().question.count()).toBe(9);
    expect(report.warnings.some((warning) => warning.includes("questions.json, élément 3") && warning.includes("énoncé"))).toBe(true);
    expect(report.warnings.some((warning) => warning.includes("questions.json, élément 5") && warning.includes("categorie/inconnue"))).toBe(true);
    // Le quiz qui citait la question refusée le signale aussi.
    expect(report.warnings.some((warning) => warning.includes("quizzes.json") && warning.includes("q-003"))).toBe(true);
  });
});

describe("contrôles à la lecture d'un pack", () => {
  const minimal = { formatVersion: 1, identity: { name: "Essai" } };
  const packOf = (manifest: unknown): Pack => ({ manifest: parsePackManifest(manifest), files: new Map() });

  it("un pack minimal est valide : toutes les sections sont facultatives", async () => {
    const { warnings } = await applyPackConfig(packOf(minimal));
    expect(warnings).toEqual([]);
    const community = await loadCommunity();
    expect(community.name).toBe("Essai");
    // Sans précision, les modules prennent leur état par défaut.
    expect(activeModules(await readModuleStates()).map((module) => module.key).sort()).toEqual(["news", "quiz"]);
  });

  it("refuse un pack d'une version plus récente, avec un message clair", () => {
    expect(() => parsePackManifest({ ...minimal, formatVersion: 99 })).toThrow(/plus récente/);
  });

  it("indique précisément ce qui ne va pas dans pack.json", () => {
    try {
      parsePackManifest({ formatVersion: 1, identity: { name: "" }, theme: { colors: { primary: "rouge", accent: "#000000" }, font: "systeme" } });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PackError);
      const details = (error as PackError).details.join("\n");
      expect(details).toContain("identity › name");
      expect(details).toContain("theme › colors › primary");
    }
  });

  it("refuse un pack qui désactive tous les modules", async () => {
    const manifest = { ...minimal, modules: { news: { enabled: false }, quiz: { enabled: false }, knowledge: { enabled: false } } };
    await expect(applyPackConfig(packOf(manifest))).rejects.toThrow(/au moins un/);
    // Rien n'a été enregistré.
    expect((await loadCommunity()).exists).toBe(false);
  });

  it("signale un module inconnu et un fichier manquant, sans bloquer", async () => {
    const manifest = { ...minimal, identity: { name: "Essai", logo: "media/absent.png" }, modules: { futur: { enabled: true } } };
    const { warnings } = await applyPackConfig(packOf(manifest));
    expect(warnings).toHaveLength(2);
    expect(warnings.join(" ")).toContain("futur");
    expect(warnings.join(" ")).toContain("media/absent.png");
  });

  it("signale un dossier sans pack.json", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "pack-vide-"));
    await expect(readPackDirectory(empty)).rejects.toThrow(/pack\.json/);
    fs.rmSync(empty, { recursive: true });
  });
});
