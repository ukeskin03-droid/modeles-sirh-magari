/**
 * MOTS DE PASSE
 *
 * Un mot de passe n'est jamais enregistré tel quel : on enregistre son « empreinte »,
 * calculée par l'algorithme scrypt (fourni par Node.js, sans bibliothèque externe).
 * L'empreinte ne permet pas de retrouver le mot de passe, seulement de vérifier
 * qu'un mot de passe saisi est le bon.
 */
import crypto from "node:crypto";

export const PASSWORD_MIN_LENGTH = 10;

// Paramètres de scrypt : plus N est grand, plus le calcul est coûteux pour un attaquant.
const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 128 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Calcule l'empreinte à enregistrer en base. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

/** Vérifie qu'un mot de passe saisi correspond à l'empreinte enregistrée. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, n, r, p, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  try {
    const expectedKey = Buffer.from(expected, "base64url");
    const key = await scrypt(password, Buffer.from(salt, "base64url"), Number(n), Number(r), Number(p));
    // Comparaison « à temps constant » : sa durée ne révèle rien sur l'empreinte.
    return key.length === expectedKey.length && crypto.timingSafeEqual(key, expectedKey);
  } catch {
    return false;
  }
}

/** Règle de solidité, volontairement simple : la longueur est ce qui protège le mieux. */
export function isPasswordAcceptable(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= 200;
}
