/**
 * JETONS
 *
 * Un jeton est une longue valeur aléatoire, impossible à deviner, remise à une seule
 * personne (dans un cookie de session, ou dans un lien d'invitation).
 * En base, on ne garde que son empreinte : même quelqu'un qui lirait la base ne
 * pourrait pas se faire passer pour cette personne.
 */
import crypto from "node:crypto";

export function createToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Comparaison de deux textes dont la durée ne dépend pas de leur contenu. */
export function safeEqual(a: string, b: string): boolean {
  const left = crypto.createHash("sha256").update(a).digest();
  const right = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(left, right);
}
