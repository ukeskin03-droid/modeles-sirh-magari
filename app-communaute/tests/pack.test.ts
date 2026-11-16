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
