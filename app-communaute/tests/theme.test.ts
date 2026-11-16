/**
 * THÈME — quelles que soient les couleurs choisies pour une communauté, les textes
 * doivent rester lisibles, en clair comme en sombre.
 */
import { describe, expect, it } from "vitest";
import { buildTheme, contrastWarnings, themeToCss } from "@/core/theme/build";
import { contrast, hexToHsl, hslToHex } from "@/core/theme/colors";

// Des couleurs volontairement difficiles : très claires, très sombres, très vives.
const PALETTES = [
  { primary: "#0f6e73", accent: "#c2571a" },
  { primary: "#8a3b2a", accent: "#2e6b4f" },
  { primary: "#ffe94d", accent: "#00e5ff" },
  { primary: "#ffffff", accent: "#000000" },
  { primary: "#000000", accent: "#ffffff" },
  { primary: "#ff0000", accent: "#00ff00" },
  { primary: "#7f7f7f", accent: "#808080" },
];

describe("thème", () => {
  it.each(PALETTES)("garantit des contrastes suffisants pour $primary / $accent", (colors) => {
    const theme = buildTheme(colors, "systeme");
    for (const mode of ["light", "dark"] as const) {
      const tokens = theme[mode];
      const backgrounds = [tokens.bg, tokens.surface, tokens["surface-2"]];
      for (const background of backgrounds) {
        expect(contrast(tokens.fg, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens.muted, background)).toBeGreaterThanOrEqual(4.5);
      }
      for (const name of ["primary", "accent", "danger", "success", "warning"]) {
        // Texte posé sur un aplat (bouton)
        expect(contrast(tokens[`on-${name}`], tokens[name])).toBeGreaterThanOrEqual(4.5);
        // Texte coloré (lien, badge) sur les fonds et sur son fond doux
        for (const background of [...backgrounds, tokens[`${name}-soft`]]) {
          expect(contrast(tokens[`${name}-text`], background)).toBeGreaterThanOrEqual(4.5);
        }
        // L'aplat se détache du fond des cartes
        expect(contrast(tokens[name], tokens.surface)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("produit une feuille de style avec les versions claire et sombre", () => {
    const css = themeToCss(buildTheme(PALETTES[0], "serif"));
    expect(css).toContain("--c-primary:#0f6e73");
    expect(css).toContain("prefers-color-scheme:dark");
    expect(css).toContain(':root[data-theme="dark"]');
    expect(css).toContain("--font-app:Charter");
  });

  it("signale une couleur trop claire pour servir d'aplat", () => {
    expect(contrastWarnings({ primary: "#ffe94d", accent: "#0f6e73" }).some((issue) => issue.token === "primary" && issue.mode === "light")).toBe(true);
    expect(contrastWarnings({ primary: "#0f6e73", accent: "#8a3b2a" }).filter((issue) => issue.mode === "light")).toEqual([]);
  });

  it("convertit les couleurs sans les dénaturer", () => {
    for (const color of ["#0f6e73", "#8a3b2a", "#ffffff", "#000000", "#c2571a"]) {
      expect(hslToHex(hexToHsl(color))).toBe(color);
    }
  });
});
