/**
 * DÉMONSTRATION : les deux communautés d'exemple côte à côte.
 *
 *   npm run demo
 *
 * Le MÊME code (construit une seule fois) est lancé deux fois, avec deux dossiers de
 * données différents :
 *   http://localhost:3001  → donnees/peopledoc
 *   http://localhost:3002  → donnees/copropriete
 * C'est exactement le principe « une installation = le code + un dossier de données ».
 */
import fs from "node:fs";
import path from "node:path";
import { chargerEnv, dossierDe, executer, lancer, mettreBaseANiveau, racine } from "./outils.mjs";

chargerEnv();

const communautes = [
  { nom: "peopledoc", port: "3001" },
  { nom: "copropriete", port: "3002" },
];

// 1. Charger les exemples (seulement si le dossier de données n'existe pas encore).
for (const { nom } of communautes) {
  if (!fs.existsSync(path.join(racine, dossierDe(nom), "base.db"))) executer("tsx", ["scripts/amorcer.ts", nom]);
  else mettreBaseANiveau({ DATA_DIR: dossierDe(nom) });
}

// 2. Construire l'application (une seule fois pour les deux communautés).
executer("next", ["build"]);

// 3. Lancer les deux installations.
const serveurs = communautes.map(({ nom, port }) => lancer("next", ["start"], { DATA_DIR: dossierDe(nom), PORT: port }));
console.log("\n  PeopleDoc    → http://localhost:3001\n  Copropriété  → http://localhost:3002\n  (Ctrl+C pour arrêter)\n");

const arreter = () => serveurs.forEach((serveur) => serveur.kill());
process.on("SIGINT", arreter);
process.on("SIGTERM", arreter);
