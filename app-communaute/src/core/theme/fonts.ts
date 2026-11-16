/**
 * POLICES PROPOSÉES
 *
 * Ce sont des « familles de polices système » : elles utilisent les polices déjà
 * présentes sur l'appareil du visiteur. Rien n'est téléchargé depuis un site tiers,
 * ce qui est plus rapide et plus simple au regard du RGPD.
 *
 * Pour ajouter une police : ajouter une entrée ici et son libellé dans
 * src/core/i18n/labels.fr.ts (clé « core.font.<identifiant> »).
 */
export const FONTS = {
  systeme: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  humaniste: 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
  geometrique: 'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
  arrondie:
    'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif',
  serif: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  classique: '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
} as const;

export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as [FontKey, ...FontKey[]];
export const DEFAULT_FONT: FontKey = "systeme";
