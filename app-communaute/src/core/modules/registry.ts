/**
 * LE REGISTRE DE MODULES
 *
 * Ce fichier rassemble les fiches des modules installés (listées dans src/registry.ts)
 * et celle du moteur, puis répond aux questions du reste de l'application :
 * « quels modules sont actifs ? », « quelles entrées de menu afficher ? »,
 * « quels écrans d'administration ? », « quelles actions existent ? »…
 *
 * Toutes les fonctions ci-dessous sont « pures » : elles ne lisent pas la base. On leur
 * donne l'état des modules, elles renvoient ce qui en découle. C'est ce qui permet de
 * les tester facilement (tests/modules.test.ts).
 */
import { installedModules } from "@/registry";
import { buildActionIndex, roleCan, type ActionDefinition, type ActionIndex } from "@/core/auth/permissions";
import type { Role } from "@/core/auth/roles";
import { coreDefinition } from "@/core/core-definition";
import type { Labels, Vocabulary } from "@/core/i18n/translate";
import type {
  ActivityEventDefinition,
  AdminScreenDefinition,
  ContentTypeDefinition,
  HomeBlockDefinition,
  ImportFormatDefinition,
  LinkedFieldDefinition,
  PackSectionDefinition,
  ModuleDefinition,
  NavigationEntry,
  NotificationEventDefinition,
  ScheduledTaskDefinition,
} from "./types";

/** Tous les modules installés, actifs ou non. */
export function allModules(): readonly ModuleDefinition[] {
  return installedModules;
}

export function findModule(key: string): ModuleDefinition | undefined {
  return installedModules.find((module) => module.key === key);
}

/** État enregistré en base : clé du module → activé ou non. */
export type ModuleStates = ReadonlyMap<string, boolean>;

/**
 * Détermine les modules actifs.
 *  - Un module sans état enregistré prend sa valeur par défaut.
 *  - Un module-extension n'est actif que si les modules qu'il nécessite le sont.
 * (Le second paramètre ne sert qu'aux tests : par défaut, on raisonne sur les modules installés.)
 */
export function activeModules(states: ModuleStates, modules: readonly ModuleDefinition[] = installedModules): ModuleDefinition[] {
  const wanted = new Set(modules.filter((module) => states.get(module.key) ?? module.defaultEnabled).map((module) => module.key));
  // On retire les extensions dont un module hôte manque, jusqu'à stabilité.
  let changed = true;
  while (changed) {
    changed = false;
    for (const mod of modules) {
      if (wanted.has(mod.key) && (mod.requires ?? []).some((required) => !wanted.has(required))) {
        wanted.delete(mod.key);
        changed = true;
      }
    }
  }
  return modules.filter((module) => wanted.has(module.key));
}

/** Tous les libellés : ceux du moteur et ceux de chaque module installé. */
export function allLabels(): Labels {
  return Object.assign({}, coreDefinition.labels, ...installedModules.map((module) => module.labels));
}

/** Les termes de vocabulaire par défaut des modules donnés. */
export function defaultVocabulary(modules: readonly ModuleDefinition[] = installedModules): Vocabulary {
  const vocabulary: Vocabulary = {};
  for (const mod of modules) {
    for (const term of mod.vocabulary) {
      vocabulary[term.key] = { singular: term.singular, plural: term.plural };
    }
  }
  return vocabulary;
}

/** Les actions qui existent : celles du moteur et celles des modules actifs. */
export function actionsFor(active: readonly ModuleDefinition[]): ActionIndex {
  const actions: ActionDefinition[] = [...coreDefinition.actions, ...active.flatMap((module) => module.actions)];
  return buildActionIndex(actions);
}

/** Le menu des lecteurs. */
export function navigationFor(active: readonly ModuleDefinition[]): NavigationEntry[] {
  return [...coreDefinition.navigation, ...active.flatMap((module) => module.navigation)];
}

/**
 * Les blocs de la page d'accueil.
 * « configured » est la liste ordonnée choisie par la communauté (null = tous les blocs).
 * Un bloc d'un module désactivé est ignoré, même s'il figure dans la configuration.
 */
export function homeBlocksFor(active: readonly ModuleDefinition[], configured: readonly string[] | null): HomeBlockDefinition[] {
  const available = active.flatMap((module) => module.homeBlocks);
  if (!configured) return available;
  const byId = new Map(available.map((block) => [block.id, block]));
  return configured.flatMap((id) => byId.get(id) ?? []);
}

/** Les écrans d'administration visibles par un rôle donné. */
export function adminScreensFor(active: readonly ModuleDefinition[], role: Role): AdminScreenDefinition[] {
  const index = actionsFor(active);
  const screens = [...active.flatMap((module) => module.adminScreens), ...coreDefinition.adminScreens];
  return screens.filter((screen) => roleCan(role, screen.action, index));
}

/** Un type de contenu, parmi ceux des modules donnés (undefined si son module n'en fait pas partie). */
export function findContentType(type: string, modules: readonly ModuleDefinition[] = installedModules): ContentTypeDefinition | undefined {
  return modules.flatMap((module) => module.contentTypes).find((contentType) => contentType.type === type);
}

/**
 * Les champs liés proposés à un type de contenu hôte par les modules ACTIFS.
 * Un champ n'est proposé que si le module qui le déclare et celui du contenu visé sont actifs.
 */
export function linkedFieldsFor(active: readonly ModuleDefinition[], hostType: string): LinkedFieldDefinition[] {
  return active
    .flatMap((module) => module.linkedFields)
    .filter((field) => field.hostType === hostType && findContentType(field.targetType, active) !== undefined);
}

/** Les formats d'import en masse des modules ACTIFS. */
export function importFormatsFor(active: readonly ModuleDefinition[]): (ImportFormatDefinition & { moduleKey: string })[] {
  return active.flatMap((module) => (module.importFormats ?? []).map((format) => ({ ...format, moduleKey: module.key })));
}

/** Toutes les sections de pack des modules installés (un pack s'importe même pour un module inactif). */
export function packSectionsCatalog(): (PackSectionDefinition & { moduleKey: string })[] {
  return installedModules.flatMap((module) => module.packSections.map((section) => ({ ...section, moduleKey: module.key })));
}

/** Les types d'événements du journal d'activité, avec leur libellé. */
export function activityEventsCatalog(): ActivityEventDefinition[] {
  return [...coreDefinition.activityEvents, ...installedModules.flatMap((module) => module.activityEvents)];
}

/** Une tâche planifiée, avec le module qui la déclare (null = le moteur). */
export type RegisteredTask = ScheduledTaskDefinition & { moduleKey: string | null };

export function scheduledTasksCatalog(): RegisteredTask[] {
  return [
    ...coreDefinition.scheduledTasks.map((task) => ({ ...task, moduleKey: null })),
    ...installedModules.flatMap((module) => module.scheduledTasks.map((task) => ({ ...task, moduleKey: module.key }))),
  ];
}

export type RegisteredNotification = NotificationEventDefinition & { moduleKey: string | null };

export function notificationEventsCatalog(): RegisteredNotification[] {
  return [
    ...coreDefinition.notificationEvents.map((event) => ({ ...event, moduleKey: null })),
    ...installedModules.flatMap((module) =>
      module.notificationEvents.map((event) => ({ ...event, moduleKey: module.key })),
    ),
  ];
}

/**
 * Contrôle de cohérence des fiches de modules. Renvoie la liste des anomalies
 * (vide si tout va bien). Lancé par les tests : une fiche mal remplie fait échouer
 * les tests au lieu de provoquer une erreur chez un utilisateur.
 */
export function registryProblems(): string[] {
  const problems: string[] = [];
  const seenKeys = new Set<string>();
  const seenSegments = new Set<string>();
  const labels = allLabels();
  const reservedSegments = new Set(["admin", "api", "connexion", "installation", "invitation", "bientot", "media", "l"]);

  const requireLabel = (owner: string, key: string) => {
    if (!(key in labels)) problems.push(`${owner} : le libellé « ${key} » n'existe pas`);
  };

  for (const mod of installedModules) {
    const owner = `module ${mod.key}`;
    if (seenKeys.has(mod.key)) problems.push(`${owner} : clé en double`);
    seenKeys.add(mod.key);
    if (seenSegments.has(mod.routeSegment) || reservedSegments.has(mod.routeSegment)) {
      problems.push(`${owner} : le segment d'adresse « ${mod.routeSegment} » est déjà pris`);
    }
    seenSegments.add(mod.routeSegment);

    const actionKeys = new Set(mod.actions.map((action) => action.key));
    requireLabel(owner, mod.nameKey);
    requireLabel(owner, mod.descriptionKey);
    for (const key of Object.keys(mod.labels)) {
      if (!key.startsWith(`${mod.key}.`)) problems.push(`${owner} : le libellé « ${key} » doit commencer par « ${mod.key}. »`);
    }
    for (const term of mod.vocabulary) {
      if (!term.key.startsWith(`${mod.key}.`)) problems.push(`${owner} : le terme « ${term.key} » doit commencer par « ${mod.key}. »`);
    }
    for (const entry of mod.navigation) {
      requireLabel(owner, entry.labelKey);
      if (entry.href !== `/${mod.routeSegment}` && !entry.href.startsWith(`/${mod.routeSegment}/`)) {
        problems.push(`${owner} : l'entrée de menu « ${entry.id} » doit pointer sous /${mod.routeSegment}`);
      }
    }
    for (const block of mod.homeBlocks) {
      requireLabel(owner, block.labelKey);
      if (!block.id.startsWith(`${mod.key}.`)) problems.push(`${owner} : le bloc « ${block.id} » doit commencer par « ${mod.key}. »`);
    }
    for (const action of mod.actions) {
      if (!action.key.startsWith(`${mod.key}.`)) problems.push(`${owner} : l'action « ${action.key} » doit commencer par « ${mod.key}. »`);
    }
    for (const screen of mod.adminScreens) {
      requireLabel(owner, screen.labelKey);
      requireLabel(owner, screen.descriptionKey);
      if (!actionKeys.has(screen.action)) problems.push(`${owner} : l'écran « ${screen.id} » utilise une action non déclarée (${screen.action})`);
      if (!screen.href.startsWith(`/admin/${mod.routeSegment}`)) {
        problems.push(`${owner} : l'écran « ${screen.id} » doit pointer sous /admin/${mod.routeSegment}`);
      }
    }
    for (const event of mod.activityEvents) requireLabel(owner, event.labelKey);
    for (const contentType of mod.contentTypes) {
      requireLabel(owner, contentType.labelKey);
      if (!contentType.type.startsWith(`${mod.key}.`)) problems.push(`${owner} : le type « ${contentType.type} » doit commencer par « ${mod.key}. »`);
    }
    for (const section of mod.packSections) requireLabel(owner, section.labelKey);
    for (const format of mod.importFormats ?? []) {
      requireLabel(owner, format.labelKey);
      requireLabel(owner, format.descriptionKey);
      for (const template of format.templates) requireLabel(owner, template.labelKey);
      if (!actionKeys.has(format.action)) problems.push(`${owner} : le format d'import « ${format.id} » utilise une action non déclarée (${format.action})`);
    }
    for (const field of mod.linkedFields) {
      requireLabel(owner, field.labelKey);
      requireLabel(owner, field.readerLabelKey);
      if (!findContentType(field.targetType, [mod])) problems.push(`${owner} : le champ lié « ${field.id} » doit viser un type de contenu du module`);
    }
    for (const required of mod.requires ?? []) {
      if (!installedModules.some((other) => other.key === required)) problems.push(`${owner} : nécessite un module inconnu (${required})`);
    }
  }

  for (const entry of coreDefinition.navigation) requireLabel("moteur", entry.labelKey);
  for (const screen of coreDefinition.adminScreens) {
    requireLabel("moteur", screen.labelKey);
    requireLabel("moteur", screen.descriptionKey);
  }
  for (const event of coreDefinition.activityEvents) requireLabel("moteur", event.labelKey);
  for (const task of scheduledTasksCatalog()) requireLabel(`tâche ${task.type}`, task.labelKey);
  for (const event of notificationEventsCatalog()) requireLabel(`notification ${event.event}`, event.labelKey);

  const taskTypes = scheduledTasksCatalog().map((task) => task.type);
  if (new Set(taskTypes).size !== taskTypes.length) problems.push("deux tâches planifiées portent le même type");

  return problems;
}
