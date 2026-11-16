"use server";

/**
 * ACTIONS DE SESSION — déconnexion et aperçu lecteur.
 *
 * Une « action » est une fonction exécutée sur le serveur quand un formulaire est
 * envoyé. Chaque action revérifie elle-même qui l'appelle : on ne fait jamais
 * confiance au fait qu'un bouton était caché.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { setPreviewAsReader } from "@/core/auth/sessions";
import { getViewer } from "@/core/request/context";
import { closeSession } from "@/core/request/session-cookie";

export async function logoutAction(): Promise<void> {
  await closeSession();
  redirect("/connexion");
}

/** Entre dans l'aperçu lecteur : les droits de la session deviennent ceux d'un lecteur. */
export async function startPreviewAction(): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || viewer.role === "reader") redirect("/");
  await setPreviewAsReader(viewer.sessionId, true);
  refresh();
  redirect("/");
}

export async function stopPreviewAction(): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) redirect("/connexion");
  await setPreviewAsReader(viewer.sessionId, false);
  refresh();
  redirect("/admin/parametres");
}
