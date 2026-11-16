import path from "node:path";

/** Dossier temporaire des tests (ignoré par git, recréé à chaque lancement). */
export const TEST_ROOT = path.resolve(".test-data");
/** Base « modèle » : une base vide, à jour, que chaque fichier de test recopie. */
export const TEMPLATE_DIR = path.join(TEST_ROOT, "modele");
