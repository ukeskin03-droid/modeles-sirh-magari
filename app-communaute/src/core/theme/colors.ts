/**
 * COULEURS : conversions et calcul du contraste
 *
 * Ces fonctions servent à construire les thèmes clair et sombre à partir des couleurs
 * choisies pour la communauté, et à garantir qu'un texte reste lisible sur son fond.
 *
 * Le « contraste » suit la norme d'accessibilité WCAG : un rapport de 4,5 au minimum
 * est exigé pour du texte courant, 3 pour des éléments graphiques.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_PATTERN.test(value);
}

export function hexToRgb(hex: string): Rgb {
  if (!isHexColor(hex)) throw new Error(`Couleur invalide : ${hex}`);
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Convertit en teinte (0-360), saturation (0-100) et luminosité (0-100). */
export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const chroma = (1 - Math.abs(2 * ln - 1)) * sn;
  const sector = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((sector % 2) - 1));
  const m = ln - chroma / 2;
  let rgb: [number, number, number];
  if (sector < 1) rgb = [chroma, x, 0];
  else if (sector < 2) rgb = [x, chroma, 0];
  else if (sector < 3) rgb = [0, chroma, x];
  else if (sector < 4) rgb = [0, x, chroma];
  else if (sector < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  return rgbToHex({ r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 });
}

/** Luminance relative d'une couleur (0 = noir, 1 = blanc), au sens de la norme WCAG. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Rapport de contraste entre deux couleurs, de 1 (identiques) à 21 (noir sur blanc). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Assombrit ou éclaircit une couleur, par petits pas, jusqu'à ce qu'elle atteigne le
 * contraste voulu sur CHACUN des fonds indiqués. La teinte est conservée.
 */
export function ensureContrast(
  color: string,
  backgrounds: readonly string[],
  minimum: number,
  direction: "darker" | "lighter",
): string {
  const hsl = hexToHsl(color);
  const step = direction === "darker" ? -1 : 1;
  let current = color;
  for (let i = 0; i <= 100; i++) {
    if (backgrounds.every((background) => contrast(current, background) >= minimum)) return current;
    const nextLightness = hsl.l + step * (i + 1);
    if (nextLightness < 0 || nextLightness > 100) break;
    current = hslToHex({ ...hsl, l: nextLightness });
  }
  // En dernier recours : noir ou blanc, qui offrent toujours le contraste maximal.
  return direction === "darker" ? "#000000" : "#ffffff";
}

const TEXT_ON_DARK_FILL = "#ffffff";
const TEXT_ON_LIGHT_FILL = "#0b0b0c";

/** Choisit la couleur de texte (claire ou sombre) la plus lisible sur un aplat de couleur. */
export function readableTextOn(fill: string): string {
  return contrast(TEXT_ON_DARK_FILL, fill) >= contrast(TEXT_ON_LIGHT_FILL, fill) ? TEXT_ON_DARK_FILL : TEXT_ON_LIGHT_FILL;
}
