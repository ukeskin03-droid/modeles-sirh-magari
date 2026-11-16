/**
 * IMPORT D'UN PACK COMPLET : la configuration, puis les sections de contenu de chaque
 * module, puis les liens entre contenus.
 *
 * - Tout se fait dans une transaction : si quelque chose échoue, rien n'est modifié.
 * - Avec « dryRun », rien n'est modifié non plus, mais on obtient le compte rendu exact de
 *   ce qui SERAIT fait : c'est le « résumé des changements avant validation ».
 * - Les contenus d'un module désactivé sont importés quand même ; un message le signale.
 */
import { loadTranslator } from "@/core/community/translator";
import { inTransaction } from "@/core/db/client";
import { activeModules, allModules, packSectionsCatalog } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";
import type { PackSectionReport } from "@/core/modules/types";
import { applyPackConfig } from "./apply-config";
import { applyPackLinks } from "./links";
import type { Pack } from "./schema";

export type PackImportReport = {
  communityName: string;
  /** Une ligne par section de contenu trouvée dans le pack */
  sections: { id: string; label: string; moduleKey: string; created: number; updated: number; unchanged: number }[];
  /** Remarques à montrer à l'utilisateur */
  warnings: string[];
};

export async function importPack(pack: Pack, options: { dryRun?: boolean } = {}): Promise<PackImportReport> {
  return inTransaction(async () => {
    const { warnings } = await applyPackConfig(pack);
    const t = await loadTranslator();
    const activeKeys = new Set(activeModules(await readModuleStates()).map((module) => module.key));

    const sections: PackImportReport["sections"] = [];
    const pendingLinks: PackSectionReport["links"] = [];
    const hiddenModules = new Set<string>();

    for (const section of packSectionsCatalog()) {
      const report = await section.import(pack.files, { t });
      const touched = report.created + report.updated + report.unchanged;
      if (touched === 0 && report.warnings.length === 0) continue; // section absente du pack
      sections.push({ id: section.id, label: t(section.labelKey), moduleKey: section.moduleKey, created: report.created, updated: report.updated, unchanged: report.unchanged });
      warnings.push(...report.warnings);
      pendingLinks.push(...report.links);
      if (touched > 0 && !activeKeys.has(section.moduleKey)) hiddenModules.add(section.moduleKey);
    }

    warnings.push(...(await applyPackLinks(pendingLinks, t)));
    for (const moduleKey of hiddenModules) {
      const hidden = allModules().find((module) => module.key === moduleKey);
      if (hidden) warnings.push(t("core.pack.hiddenModule", { module: t(hidden.nameKey) }));
    }
    return { communityName: pack.manifest.identity.name, sections, warnings };
  }, options);
}
