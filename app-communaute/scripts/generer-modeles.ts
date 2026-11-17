/**
 * Régénère les modèles d'import du dossier modeles/ à partir du code :
 *
 *   npx tsx scripts/generer-modeles.ts
 *
 * Ces fichiers sont les mêmes que ceux proposés au téléchargement dans l'écran
 * « Import en masse » (avec tous les modules actifs, donc toutes les colonnes facultatives).
 */
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { allModules, importFormatsFor } = await import("@/core/modules/registry");
  const { createTranslator } = await import("@/core/i18n/translate");
  const { allLabels, defaultVocabulary } = await import("@/core/modules/registry");
  const context = { t: createTranslator(allLabels(), defaultVocabulary()), active: allModules() };
  for (const format of importFormatsFor(allModules())) {
    for (const template of format.templates) {
      fs.writeFileSync(path.join("modeles", template.filename), template.build(context), "utf8");
      console.log(`modeles/${template.filename}`);
    }
  }
}

main();
