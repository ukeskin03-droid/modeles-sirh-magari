/**
 * CONTEXTE D'UNE VISITE
 *
 * Fonctions utilisées par les pages et les actions pour connaître, le temps d'une
 * visite : la configuration de la communauté, les modules actifs, la personne
 * connectée et ses droits.
 *
 * Deux précisions techniques :
 *  - « cache(...) » : au cours d'une même visite, la base n'est interrogée qu'une fois,
 *    même si plusieurs composants posent la même question.
 *  - « await connection() » : indique à Next.js que la suite dépend de la visite en
 *    cours et ne doit JAMAIS être calculée à l'avance, au moment de la construction de
 *    l'application. C'est indispensable ici : le même code sert plusieurs communautés,
 *    il ne doit donc rien figer d'une communauté en particulier.
 */
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE } from "@/core/auth/constants";
import { roleCan } from "@/core/auth/permissions";
import type { Role } from "@/core/auth/roles";
import { findSession } from "@/core/auth/sessions";
import { countUsers } from "@/core/auth/users";
import { loadCommunity } from "@/core/community/service";
import { translatorFor } from "@/core/community/translator";
import { configuredAppUrl } from "@/core/config/installation";
import { actionsFor, activeModules } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";

export const getCommunity = cache(async () => {
  await connection();
  return loadCommunity();
});

export const getActiveModules = cache(async () => {
  await connection();
  return activeModules(await readModuleStates());
});

/** Le traducteur : libellés de l'application + vocabulaire de la communauté. */
export const getT = cache(async () => translatorFor(await getCommunity()));

/** La personne connectée, telle que les pages la voient. */
export type Viewer = {
  id: string;
  name: string;
  email: string;
  /** Son rôle réel */
  role: Role;
  /** Le rôle à appliquer pour les droits : « lecteur » pendant un aperçu lecteur */
  effectiveRole: Role;
  isExpert: boolean;
  previewAsReader: boolean;
  sessionId: string;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  // La validité d'une session dépend de l'heure : elle se vérifie à chaque visite.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await findSession(token);
  if (!session) return null;
  const { user } = session;
  // L'aperçu lecteur n'a de sens que pour quelqu'un qui est plus qu'un lecteur.
  const previewAsReader = session.previewAsReader && user.role !== "reader";
  return {
    ...user,
    effectiveRole: previewAsReader ? "reader" : user.role,
    previewAsReader,
    sessionId: session.sessionId,
  };
});

/**
 * Exige une personne connectée et autorisée à entrer. Sinon, redirige :
 *  - vers l'installation si aucun compte n'existe encore ;
 *  - vers la connexion si personne n'est connecté ;
 *  - vers la page d'attente si la communauté est en préparation et que la personne est lectrice.
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    if ((await countUsers()) === 0) redirect("/installation");
    redirect("/connexion");
  }
  const community = await getCommunity();
  if (community.status !== "open" && viewer.role === "reader") redirect("/bientot");
  return viewer;
}

/** « La personne connectée peut-elle faire cette action ? » */
export async function viewerCan(action: string): Promise<boolean> {
  const viewer = await getViewer();
  if (!viewer) return false;
  return roleCan(viewer.effectiveRole, action, actionsFor(await getActiveModules()));
}

/** Exige le droit de faire une action ; sinon, renvoie à l'accueil. */
export async function requireCan(action: string): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!(await viewerCan(action))) redirect("/");
  return viewer;
}

/** Exige qu'un module soit actif ; sinon, renvoie à l'accueil. */
export async function requireModule(moduleKey: string): Promise<Viewer> {
  const viewer = await requireViewer();
  const active = await getActiveModules();
  if (!active.some((module) => module.key === moduleKey)) redirect("/");
  return viewer;
}

/** Pour les actions d'administration d'un module : module actif ET droit suffisant. */
export async function requireModuleCan(moduleKey: string, action: string): Promise<Viewer> {
  const viewer = await requireModule(moduleKey);
  if (!(await viewerCan(action))) redirect("/");
  return viewer;
}

/** Vrai si la visite passe par une connexion chiffrée (https). */
export async function isSecureRequest(): Promise<boolean> {
  const configured = configuredAppUrl();
  if (configured) return configured.startsWith("https://");
  return (await headers()).get("x-forwarded-proto") === "https";
}

/** Adresse de base de l'installation, pour fabriquer des liens complets (e-mails). */
export async function getBaseUrl(): Promise<string> {
  const configured = configuredAppUrl();
  if (configured) return configured;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
