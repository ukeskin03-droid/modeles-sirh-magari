/**
 * DROITS PAR RÔLE — qui peut faire quoi.
 */
import { describe, expect, it } from "vitest";
import { roleCan } from "@/core/auth/permissions";
import { roleAtLeast, type Role } from "@/core/auth/roles";
import { actionsFor, activeModules, adminScreensFor, allModules } from "@/core/modules/registry";

const everything = activeModules(new Map(allModules().map((module) => [module.key, true])));
const index = actionsFor(everything);
const can = (role: Role, action: string) => roleCan(role, action, index);

describe("droits par rôle", () => {
  it("un lecteur n'a accès à aucune fonction d'administration", () => {
    for (const action of index.keys()) expect(can("reader", action)).toBe(false);
    expect(adminScreensFor(everything, "reader")).toEqual([]);
  });

  it("un éditeur gère les contenus des modules actifs, mais pas la configuration", () => {
    expect(can("editor", "core.admin.access")).toBe(true);
    for (const action of everything.flatMap((active) => active.actions)) expect(can("editor", action.key)).toBe(true);
    expect(can("editor", "core.community.configure")).toBe(false);
    expect(can("editor", "core.users.manage")).toBe(false);
    expect(can("editor", "core.technical.view")).toBe(false);
    // Ses écrans d'administration : uniquement ceux des modules
    expect(adminScreensFor(everything, "editor").every((screen) => !screen.id.startsWith("core."))).toBe(true);
    expect(adminScreensFor(everything, "editor").length).toBeGreaterThan(0);
  });

  it("un administrateur peut tout faire", () => {
    for (const action of index.keys()) expect(can("admin", action)).toBe(true);
  });

  it("une action inconnue est toujours refusée", () => {
    expect(can("admin", "action.inexistante")).toBe(false);
  });

  it("chaque rôle inclut les droits du précédent", () => {
    expect(roleAtLeast("admin", "editor")).toBe(true);
    expect(roleAtLeast("editor", "reader")).toBe(true);
    expect(roleAtLeast("reader", "editor")).toBe(false);
    expect(roleAtLeast("editor", "admin")).toBe(false);
  });
});
