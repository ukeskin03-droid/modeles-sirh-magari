/**
 * DROITS
 *
 * Une « action » est quelque chose qu'un utilisateur peut être autorisé à faire
 * (ex. « configurer la communauté », « gérer les quiz »). Le moteur déclare les siennes,
 * chaque module déclare les siennes dans son fichier module.ts.
 *
 * Point clé pour la modularité : l'index des actions ne contient que les actions du
 * moteur et celles des modules ACTIFS. Une action d'un module désactivé n'existe donc
 * plus, et personne ne peut l'exercer, quel que soit son rôle.
 */
import { roleAtLeast, type Role } from "./roles";

export type ActionDefinition = {
  /** Identifiant de l'action, ex. "quiz.manage" */
  key: string;
  /** Rôle minimum requis */
  minRole: Role;
};

export type ActionIndex = ReadonlyMap<string, ActionDefinition>;

export function buildActionIndex(actions: readonly ActionDefinition[]): ActionIndex {
  return new Map(actions.map((action) => [action.key, action]));
}

/** Répond à la question : « ce rôle peut-il faire cette action ? » */
export function roleCan(role: Role, actionKey: string, index: ActionIndex): boolean {
  const action = index.get(actionKey);
  if (!action) return false; // action inconnue, ou appartenant à un module désactivé
  return roleAtLeast(role, action.minRole);
}
