/**
 * LANCEMENT D'UNE INSTALLATION
 *
 *   node scripts/lancer.mjs dev                      → développement, dossier donnees/defaut
 *   node scripts/lancer.mjs dev peopledoc 3001       → développement, dossier donnees/peopledoc, port 3001
 *   node scripts/lancer.mjs start                    → production (après « npm run build »)
 *
 * Avant de démarrer, la base de la communauté est mise à niveau automatiquement.
 * En pratique, on passe par les raccourcis de package.json : npm run dev, npm start…
 */
import { chargerEnv, dossierDe, exigerPortLibre, lancer, mettreBaseANiveau } from "./outils.mjs";

chargerEnv();

const [mode = "dev", communaute, port] = process.argv.slice(2);
if (!["dev", "start"].includes(mode)) {
  console.error("Usage : node scripts/lancer.mjs <dev|start> [communaute] [port]");
  process.exit(1);
}

const env = {};
if (communaute) env.DATA_DIR = dossierDe(communaute);
if (port) env.PORT = port;

await exigerPortLibre(port ?? process.env.PORT ?? "3000");
mettreBaseANiveau(env);
const serveur = lancer("next", [mode], env);
serveur.on("exit", (code) => process.exit(code ?? 0));
