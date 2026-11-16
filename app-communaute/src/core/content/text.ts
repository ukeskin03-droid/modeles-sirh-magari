/**
 * Petits outils sur les textes : identifiants d'adresse et texte de recherche.
 */

/** Minuscules et sans accents : « Écoles d'été » → « ecoles d'ete ». Sert à la recherche. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Identifiant d'adresse : « Écoles d'été 2026 ! » → « ecoles-d-ete-2026 ». */
export function slugify(text: string): string {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

/**
 * Trouve un identifiant libre : « mon-titre », puis « mon-titre-2 », « mon-titre-3 »…
 * « isTaken » dit si un identifiant est déjà utilisé.
 */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>, fallback = "contenu"): Promise<string> {
  const root = slugify(base) || fallback;
  if (!(await isTaken(root))) return root;
  for (let suffix = 2; ; suffix++) {
    const candidate = `${root.slice(0, 74)}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
}
