/**
 * ÉTAT DES MODULES EN BASE
 *
 * Activer ou désactiver un module ne modifie qu'une chose : la colonne « enabled » de sa
 * ligne dans la table ModuleState. Ses contenus et ses réglages ne sont jamais touchés,
 * ce qui garantit qu'une réactivation restaure tout à l'identique.
 */
import { db } from "@/core/db/client";
import { activeModules, findModule, type ModuleStates } from "./registry";

export async function readModuleStates(): Promise<ModuleStates> {
  const rows = await db().moduleState.findMany();
  return new Map(rows.map((row) => [row.key, row.enabled]));
}

export class ModuleToggleError extends Error {
  constructor(public readonly reason: "unknown-module" | "last-active-module" | "missing-requirement") {
    super(reason);
  }
}

export async function setModuleEnabled(key: string, enabled: boolean): Promise<void> {
  const target = findModule(key);
  if (!target) throw new ModuleToggleError("unknown-module");

  const states = new Map(await readModuleStates());
  const activeBefore = activeModules(states).map((module) => module.key);

  if (enabled) {
    // Une extension ne s'active que si les modules qu'elle prolonge sont actifs.
    if ((target.requires ?? []).some((required) => !activeBefore.includes(required))) {
      throw new ModuleToggleError("missing-requirement");
    }
  } else {
    // Règle de la spec : il doit toujours rester au moins un module actif.
    states.set(key, false);
    if (activeModules(states).length === 0) throw new ModuleToggleError("last-active-module");
  }

  await db().moduleState.upsert({
    where: { key },
    create: { key, enabled, settings: {} },
    update: { enabled },
  });
}
