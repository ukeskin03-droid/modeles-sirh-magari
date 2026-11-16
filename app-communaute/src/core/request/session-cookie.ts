/**
 * Dépôt et retrait du cookie de session dans le navigateur.
 *  - httpOnly : le cookie est invisible pour le code JavaScript de la page ;
 *  - sameSite « lax » : il n'est pas envoyé par les formulaires d'autres sites ;
 *  - secure : il ne circule que sur une connexion chiffrée, dès que le site est en https.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/core/auth/constants";
import { createSession, deleteSession } from "@/core/auth/sessions";
import { isSecureRequest } from "./context";

/** Durée de vie du cookie. La vraie limite est l'échéance de la session, tenue en base. */
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export async function openSession(userId: string): Promise<void> {
  const { token } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function closeSession(): Promise<void> {
  const store = await cookies();
  await deleteSession(store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
}
