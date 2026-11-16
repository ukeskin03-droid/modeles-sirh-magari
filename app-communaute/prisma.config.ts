/**
 * Configuration de Prisma (l'outil qui fait le lien entre le code et la base de données).
 *
 * La base est un fichier SQLite rangé dans le dossier de données de la communauté :
 * son emplacement vient donc de la variable DATA_DIR (voir .env.example).
 */
import { defineConfig } from "prisma/config";
import { databaseUrl, ensureDataDir } from "./src/core/config/installation";

// Les commandes Prisma ne lisent pas le fichier .env toutes seules.
try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env : les valeurs par défaut s'appliquent.
}

ensureDataDir();

export default defineConfig({
  // Le schéma est découpé en plusieurs fichiers : un pour le moteur, un par module.
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations" },
  datasource: { url: databaseUrl() },
});
