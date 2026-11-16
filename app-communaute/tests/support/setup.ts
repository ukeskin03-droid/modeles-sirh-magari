/**
 * Exécuté avant chaque fichier de test : lui donne son propre dossier de données,
 * avec une copie de la base modèle. Les tests ne peuvent donc pas se gêner entre eux
 * ni toucher aux données de développement.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { TEMPLATE_DIR, TEST_ROOT } from "./paths";

const folder = path.join(TEST_ROOT, crypto.randomUUID());
fs.mkdirSync(folder, { recursive: true });
fs.copyFileSync(path.join(TEMPLATE_DIR, "base.db"), path.join(folder, "base.db"));

process.env.DATA_DIR = folder;
process.env.APP_SECRET = "secret-de-test-secret-de-test-secret-de-test";
delete process.env.SMTP_URL;
