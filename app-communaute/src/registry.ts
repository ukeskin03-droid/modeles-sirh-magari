/**
 * LISTE DES MODULES INSTALLÉS
 *
 * C'est le seul fichier à modifier pour ajouter un module à l'application : on importe
 * sa fiche (module.ts) et on l'ajoute à la liste. L'ordre de la liste est l'ordre
 * d'affichage par défaut (menu, page d'accueil, administration).
 *
 * « Installé » ne veut pas dire « actif » : chaque communauté choisit ensuite, depuis
 * l'interface, les modules qu'elle active.
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { knowledgeModule } from "@/modules/knowledge/module";
import { newsModule } from "@/modules/news/module";
import { quizModule } from "@/modules/quiz/module";

export const installedModules: readonly ModuleDefinition[] = [newsModule, quizModule, knowledgeModule];
