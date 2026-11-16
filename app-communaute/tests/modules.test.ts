/**
 * MODULES — activation et désactivation de chaque module, et fonctionnement d'une
 * communauté sans base de connaissance.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { roleCan } from "@/core/auth/permissions";
import { db } from "@/core/db/client";
import {
  actionsFor,
  activeModules,
  adminScreensFor,
  allModules,
  defaultVocabulary,
  homeBlocksFor,
  navigationFor,
} from "@/core/modules/registry";
import { ModuleToggleError, readModuleStates, setModuleEnabled } from "@/core/modules/state";
import type { ModuleDefinition } from "@/core/modules/types";
import { resetDatabase } from "./support/database";

const allOn = () => new Map(allModules().map((module) => [module.key, true]));

/** Tout ce qu'un ensemble de modules actifs fait apparaître dans l'application. */
function footprint(states: Map<string, boolean>) {
  const active = activeModules(states);
  return {
    navigation: navigationFor(active).map((entry) => entry.id),
    homeBlocks: homeBlocksFor(active, null).map((block) => block.id),
    adminScreens: adminScreensFor(active, "admin").map((screen) => screen.id),
    actions: [...actionsFor(active).keys()],
    vocabulary: Object.keys(defaultVocabulary(active)),
  };
}

describe.each(allModules().map((module) => [module.key, module] as const))("module « %s »", (key, module) => {
  it("actif : il apparaît dans le menu, l'accueil, l'administration, les droits et le vocabulaire", () => {
    const shown = footprint(allOn());
    for (const entry of module.navigation) expect(shown.navigation).toContain(entry.id);
    for (const block of module.homeBlocks) expect(shown.homeBlocks).toContain(block.id);
    for (const screen of module.adminScreens) expect(shown.adminScreens).toContain(screen.id);
    for (const action of module.actions) expect(shown.actions).toContain(action.key);
    for (const term of module.vocabulary) expect(shown.vocabulary).toContain(term.key);
  });

  it("désactivé : il disparaît partout, et rien d'autre ne change", () => {
    const before = footprint(allOn());
    const after = footprint(allOn().set(key, false));
    const own = (id: string) => id.startsWith(`${key}.`);

    for (const list of ["navigation", "homeBlocks", "adminScreens", "actions", "vocabulary"] as const) {
      // plus aucune trace du module…
      expect(after[list].filter(own)).toEqual([]);
      // …et tout le reste est intact, dans le même ordre
      expect(after[list]).toEqual(before[list].filter((id) => !own(id)));
    }
  });

  it("désactivé : ses actions sont refusées, même à un administrateur", () => {
    const index = actionsFor(activeModules(allOn().set(key, false)));
    for (const action of module.actions) expect(roleCan("admin", action.key, index)).toBe(false);
  });

  it("désactivé : un bloc d'accueil resté dans la configuration est ignoré", () => {
    const configured = allModules().flatMap((other) => other.homeBlocks.map((block) => block.id));
    const blocks = homeBlocksFor(activeModules(allOn().set(key, false)), configured).map((block) => block.id);
    expect(blocks.filter((id) => id.startsWith(`${key}.`))).toEqual([]);
    expect(blocks.length).toBe(configured.length - module.homeBlocks.length);
  });
});

describe("communauté sans base de connaissance", () => {
  it("fonctionne entièrement, sans aucune trace des articles", () => {
    const shown = footprint(new Map([["news", true], ["quiz", true], ["knowledge", false]]));
    expect(JSON.stringify(shown)).not.toContain("knowledge");
    expect(shown.navigation).toEqual(["core.home", "news.home", "quiz.home"]);
    expect(shown.homeBlocks).toEqual(["news.latest", "quiz.featured"]);
    // l'administration reste complète : contenus des modules actifs + configuration
    expect(shown.adminScreens).toEqual(["news.manage", "quiz.manage", "core.modules", "core.settings", "core.users", "core.technical"]);
  });
});

describe("modules-extensions (rubrique « requires »)", () => {
  const fake = (key: string, requires?: string[]): ModuleDefinition => ({
    key,
    routeSegment: key,
    defaultEnabled: true,
    icon: "info",
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    labels: {},
    vocabulary: [],
    navigation: [],
    homeBlocks: [],
    adminScreens: [],
    actions: [],
    activityEvents: [],
    notificationEvents: [],
    scheduledTasks: [],
    requires,
  });
  const modules = [fake("hote"), fake("extension", ["hote"]), fake("sur-extension", ["extension"])];

  it("une extension n'est active que si son module hôte l'est", () => {
    expect(activeModules(new Map(), modules).map((module) => module.key)).toEqual(["hote", "extension", "sur-extension"]);
    expect(activeModules(new Map([["hote", false]]), modules)).toEqual([]);
    expect(activeModules(new Map([["extension", false]]), modules).map((module) => module.key)).toEqual(["hote"]);
  });
});

describe("activation en base", () => {
  beforeEach(resetDatabase);

  it("une communauté neuve a les modules par défaut", async () => {
    const active = activeModules(await readModuleStates()).map((module) => module.key);
    expect(active.sort()).toEqual(["news", "quiz"]);
  });

  it("désactiver puis réactiver un module conserve ses réglages à l'identique", async () => {
    await db().moduleState.create({ data: { key: "quiz", enabled: true, settings: { exemple: "valeur", nombre: 3 } } });

    await setModuleEnabled("quiz", false);
    expect((await readModuleStates()).get("quiz")).toBe(false);
    expect((await db().moduleState.findUnique({ where: { key: "quiz" } }))?.settings).toEqual({ exemple: "valeur", nombre: 3 });

    await setModuleEnabled("quiz", true);
    const row = await db().moduleState.findUnique({ where: { key: "quiz" } });
    expect(row?.enabled).toBe(true);
    expect(row?.settings).toEqual({ exemple: "valeur", nombre: 3 });
  });

  it("activer la base de connaissance la fait apparaître ; la désactiver la fait disparaître", async () => {
    await setModuleEnabled("knowledge", true);
    expect(activeModules(await readModuleStates()).map((module) => module.key)).toContain("knowledge");
    await setModuleEnabled("knowledge", false);
    expect(activeModules(await readModuleStates()).map((module) => module.key)).not.toContain("knowledge");
  });

  it("refuse de désactiver le dernier module actif", async () => {
    await setModuleEnabled("news", false);
    await expect(setModuleEnabled("quiz", false)).rejects.toMatchObject({ reason: "last-active-module" });
    expect(activeModules(await readModuleStates()).map((module) => module.key)).toEqual(["quiz"]);
  });

  it("refuse un module inconnu", async () => {
    await expect(setModuleEnabled("inexistant", true)).rejects.toBeInstanceOf(ModuleToggleError);
  });
});
