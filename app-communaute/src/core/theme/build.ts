/**
 * CONSTRUCTION DU THÈME
 *
 * À partir de deux couleurs choisies pour la communauté (principale et secondaire) et
 * d'une police, on calcule toutes les couleurs de l'interface, en clair et en sombre.
 * Les composants n'utilisent jamais une couleur « en dur » : ils utilisent ces variables
 * (ex. la classe Tailwind « bg-primary » lit la variable --c-primary).
 *
 * Garanties vérifiées par les tests (tests/theme.test.ts) :
 *  - le texte courant et le texte secondaire ont un contraste d'au moins 4,5 sur tous les fonds ;
 *  - le texte posé sur un aplat de couleur (bouton) a un contraste d'au moins 4,5.
 */
import { contrast, ensureContrast, hexToHsl, hslToHex, readableTextOn } from "./colors";
import { FONTS, type FontKey } from "./fonts";

export type ThemeColors = { primary: string; accent: string };
export type ThemeTokens = Record<string, string>;
export type BuiltTheme = { light: ThemeTokens; dark: ThemeTokens; font: string };

/** Couleurs d'état, identiques pour toutes les communautés. */
const STATUS_COLORS = { danger: "#c62828", success: "#1b7f3b", warning: "#9a6700" } as const;

const TEXT_MINIMUM = 4.5;
const GRAPHIC_MINIMUM = 3;

function buildMode(colors: ThemeColors, mode: "light" | "dark"): ThemeTokens {
  const isLight = mode === "light";
  const primaryHsl = hexToHsl(colors.primary);
  // Les fonds et les textes sont très légèrement teintés par la couleur principale.
  const hue = primaryHsl.h;
  const tint = Math.min(primaryHsl.s * 0.25, 16);
  const neutral = (lightness: number, saturation = tint) => hslToHex({ h: hue, s: saturation, l: lightness });

  const bg = neutral(isLight ? 97.5 : 8);
  const surface = neutral(isLight ? 100 : 12);
  const surface2 = neutral(isLight ? 94 : 17);
  const line = neutral(isLight ? 84 : 28);
  const fg = neutral(isLight ? 13 : 93, tint + 6);
  const toward = isLight ? "darker" : "lighter";
  const muted = ensureContrast(neutral(isLight ? 40 : 68), [bg, surface, surface2], TEXT_MINIMUM, toward);

  const tokens: ThemeTokens = { bg, surface, "surface-2": surface2, line, fg, muted };

  // Pour chaque couleur « de marque » : un aplat, le texte posé dessus, une version
  // « texte » lisible sur les fonds, et un fond doux pour les badges et encadrés.
  const addBrand = (name: string, base: string) => {
    const hsl = hexToHsl(base);
    const soft = hslToHex({ h: hsl.h, s: Math.min(hsl.s, isLight ? 70 : 45), l: isLight ? 93 : 20 });
    // L'aplat doit se détacher du fond de carte (contraste « graphique »).
    let fill = ensureContrast(base, [surface], GRAPHIC_MINIMUM, toward);
    // Le texte posé sur l'aplat (blanc ou presque noir, selon ce qui se lit le mieux).
    // Pour une couleur « moyenne », ni l'un ni l'autre n'atteint tout à fait le contraste
    // requis : on ajuste alors légèrement l'aplat.
    const onFill = readableTextOn(fill);
    if (contrast(onFill, fill) < TEXT_MINIMUM) {
      fill = ensureContrast(fill, [onFill], TEXT_MINIMUM, onFill === "#ffffff" ? "darker" : "lighter");
    }
    tokens[name] = fill;
    tokens[`on-${name}`] = onFill;
    tokens[`${name}-text`] = ensureContrast(base, [bg, surface, surface2, soft], TEXT_MINIMUM, toward);
    tokens[`${name}-soft`] = soft;
  };

  addBrand("primary", colors.primary);
  addBrand("accent", colors.accent);
  addBrand("danger", STATUS_COLORS.danger);
  addBrand("success", STATUS_COLORS.success);
  addBrand("warning", STATUS_COLORS.warning);

  return tokens;
}

export function buildTheme(colors: ThemeColors, font: FontKey): BuiltTheme {
  return { light: buildMode(colors, "light"), dark: buildMode(colors, "dark"), font: FONTS[font] };
}

function declarations(tokens: ThemeTokens): string {
  return Object.entries(tokens)
    .map(([name, value]) => `--c-${name}:${value};`)
    .join("");
}

/**
 * Produit la feuille de style du thème, servie à l'adresse /theme.css.
 * Le thème sombre s'applique si l'appareil le demande, sauf choix explicite de
 * l'utilisateur (attribut data-theme posé sur la page par le bouton de thème).
 */
export function themeToCss(theme: BuiltTheme): string {
  const light = declarations(theme.light);
  const dark = declarations(theme.dark);
  return [
    `:root{${light}--font-app:${theme.font};color-scheme:light;}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark}color-scheme:dark;}}`,
    `:root[data-theme="dark"]{${dark}color-scheme:dark;}`,
  ].join("\n");
}

export type ContrastIssue = { token: string; mode: "light" | "dark"; ratio: number };

/**
 * Signale les couleurs choisies qu'il a fallu corriger fortement pour rester lisibles
 * (ex. un jaune très clair). Utilisé par l'assistant pour afficher une alerte.
 */
export function contrastWarnings(colors: ThemeColors): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const theme = buildTheme(colors, "systeme");
  for (const mode of ["light", "dark"] as const) {
    for (const name of ["primary", "accent"] as const) {
      const ratio = contrast(colors[name], theme[mode].surface);
      if (ratio < GRAPHIC_MINIMUM) issues.push({ token: name, mode, ratio });
    }
  }
  return issues;
}
