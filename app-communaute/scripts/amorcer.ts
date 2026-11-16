/**
 * SCRIPT D'AMORÇAGE — charge un pack d'exemple dans une installation de développement.
 *
 *   npm run seed -- peopledoc                  → remplit donnees/peopledoc
 *   npm run seed -- copropriete                → remplit donnees/copropriete
 *   npm run seed -- peopledoc --reinitialiser  → efface d'abord ce dossier de données
 *
 * Les packs d'exemple sont dans seed/packs/. Ils sont chargés par le même mécanisme que
 * l'import d'un pack depuis l'interface : ce script ne contient donc aucun terme métier.
 * Il crée aussi trois comptes de démonstration (un par rôle).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEMO_PASSWORD = "communaute-demo";
const DEMO_USERS = [
  { name: "Camille Martin", email: "admin@exemple.test", role: "admin" },
  { name: "Sacha Bernard", email: "editeur@exemple.test", role: "editor" },
  { name: "Dominique Petit", email: "lecteur@exemple.test", role: "reader" },
] as const;

async function main() {
  const args = process.argv.slice(2);
  const packName = args.find((arg) => !arg.startsWith("--"));
  const reset = args.includes("--reinitialiser");
  const packsFolder = path.resolve("seed/packs");
  const available = fs.readdirSync(packsFolder).filter((name) => fs.existsSync(path.join(packsFolder, name, "pack.json")));

  if (!packName || !available.includes(packName)) {
    console.error(`Indiquez le pack à charger. Packs disponibles : ${available.join(", ")}`);
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("Ce script crée des comptes de démonstration : il ne s'utilise pas en production.");
    process.exit(1);
  }

  // Par défaut, chaque exemple a son propre dossier de données.
  process.env.DATA_DIR ||= path.join("donnees", packName);
  const { dataDir } = await import("@/core/config/installation");
  const folder = dataDir();

  if (reset) fs.rmSync(folder, { recursive: true, force: true });

  // Création ou mise à niveau de la base.
  const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    stdio: ["ignore", "ignore", "inherit"],
    env: process.env,
  });
  if (migration.status !== 0) process.exit(migration.status ?? 1);

  const { db } = await import("@/core/db/client");
  if ((await db().user.count()) > 0) {
    console.error(`Le dossier ${folder} contient déjà une communauté. Ajoutez --reinitialiser pour l'effacer et recommencer.`);
    process.exit(1);
  }

  const { readPackDirectory } = await import("@/core/pack/read-directory");
  const { importPack } = await import("@/core/pack/import");
  const { saveCommunity } = await import("@/core/community/service");
  const { hashPassword } = await import("@/core/auth/password");
  const { ensureRecurringJobs } = await import("@/core/jobs/runner");

  const pack = await readPackDirectory(path.join(packsFolder, packName));
  const { warnings, sections } = await importPack(pack);
  await saveCommunity({ status: "open" });

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const user of DEMO_USERS) await db().user.create({ data: { ...user, passwordHash } });
  await ensureRecurringJobs();

  console.log(`\n✔ Communauté « ${pack.manifest.identity.name} » chargée dans ${folder}`);
  for (const section of sections) console.log(`  ${section.label} : ${section.created} créé(s)`);
  for (const warning of warnings) console.log(`  ⚠ ${warning}`);
  console.log("\n  Comptes de démonstration (mot de passe : " + DEMO_PASSWORD + ")");
  for (const user of DEMO_USERS) console.log(`    ${user.role.padEnd(7)} ${user.email}`);
  console.log("");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
