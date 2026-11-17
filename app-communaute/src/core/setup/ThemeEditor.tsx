"use client";

/**
 * ÉTAPE « APPARENCE » — choix des couleurs et de la police, avec aperçu en direct.
 *
 * L'aperçu applique exactement le même calcul que l'application (buildTheme) : ce que
 * l'on voit ici est ce que verront les membres, en clair comme en sombre.
 */
import { useState, type CSSProperties } from "react";
import { INPUT_CLASS } from "@/core/ui/elements";
import { buildTheme, contrastWarnings, type ThemeTokens } from "@/core/theme/build";
import { isHexColor } from "@/core/theme/colors";
import { FONTS, type FontKey } from "@/core/theme/fonts";

export type ThemeEditorLabels = {
  primary: string;
  accent: string;
  font: string;
  fonts: Record<FontKey, string>;
  preview: string;
  light: string;
  dark: string;
  sampleTitle: string;
  sampleText: string;
  sampleMuted: string;
  sampleButton: string;
  sampleSecondary: string;
  sampleLink: string;
  sampleBadge: string;
  /** Contient {color}, {mode} et {ratio} */
  warning: string;
  warningColors: { primary: string; accent: string };
  warningModes: { light: string; dark: string };
  ok: string;
};

/** Transforme les couleurs calculées en variables de style, pour un bloc d'aperçu. */
const variables = (tokens: ThemeTokens, font: string) => ({ ...Object.fromEntries(Object.entries(tokens).map(([name, value]) => [`--c-${name}`, value])), fontFamily: font }) as CSSProperties;

export function ThemeEditor({ initial, labels }: { initial: { primary: string; accent: string; font: FontKey }; labels: ThemeEditorLabels }) {
  const [primary, setPrimary] = useState(initial.primary);
  const [accent, setAccent] = useState(initial.accent);
  const [font, setFont] = useState<FontKey>(initial.font);

  // Tant qu'une couleur saisie au clavier est incomplète, l'aperçu garde la dernière valide.
  const colors = { primary: isHexColor(primary) ? primary : initial.primary, accent: isHexColor(accent) ? accent : initial.accent };
  const theme = buildTheme(colors, font);
  const warnings = contrastWarnings(colors);

  const colorField = (name: "primary" | "accent", value: string, onChange: (next: string) => void) => (
    <div>
      <label htmlFor={`couleur-${name}`} className="mb-1.5 block text-sm font-medium">
        {labels[name]}
      </label>
      <div className="flex gap-2">
        <input type="color" aria-label={labels[name]} value={colors[name]} onChange={(event) => onChange(event.target.value)} className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1" />
        <input id={`couleur-${name}`} name={name} value={value} onChange={(event) => onChange(event.target.value.trim())} maxLength={7} pattern="#[0-9a-fA-F]{6}" required className={`${INPUT_CLASS} font-mono`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {colorField("primary", primary, setPrimary)}
        {colorField("accent", accent, setAccent)}
        <div>
          <label htmlFor="champ-police" className="mb-1.5 block text-sm font-medium">
            {labels.font}
          </label>
          <select id="champ-police" name="font" value={font} onChange={(event) => setFont(event.target.value as FontKey)} className={INPUT_CLASS}>
            {(Object.keys(FONTS) as FontKey[]).map((key) => (
              <option key={key} value={key}>
                {labels.fonts[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerte de contraste */}
      <div role="status" aria-live="polite">
        {warnings.length === 0 ? (
          <p className="rounded-lg border border-success-text/30 bg-success-soft px-4 py-3 text-sm">{labels.ok}</p>
        ) : (
          <ul className="space-y-2 rounded-lg border border-warning-text/30 bg-warning-soft px-4 py-3 text-sm">
            {warnings.map((issue) => (
              <li key={`${issue.token}-${issue.mode}`}>
                {labels.warning
                  .replace("{color}", labels.warningColors[issue.token as "primary" | "accent"])
                  .replace("{mode}", labels.warningModes[issue.mode])
                  .replace("{ratio}", issue.ratio.toFixed(1).replace(".", ","))}
              </li>
            ))}
          </ul>
        )}
      </div>

      <section aria-label={labels.preview}>
        <h2 className="mb-3 text-sm font-semibold">{labels.preview}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => (
            <div key={mode} style={variables(theme[mode], theme.font)} className="overflow-hidden rounded-xl border border-line bg-bg text-fg">
              <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block size-5 rounded bg-primary" aria-hidden="true" />
                  {mode === "light" ? labels.light : labels.dark}
                </span>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary-text">{labels.sampleBadge}</span>
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-lg bg-primary px-4 py-3 font-bold text-on-primary">{labels.sampleTitle}</div>
                <div className="rounded-lg border border-line bg-surface p-4">
                  <p>{labels.sampleText}</p>
                  <p className="mt-1 text-sm text-muted">{labels.sampleMuted}</p>
                  <p className="mt-2 text-sm font-semibold text-primary-text underline">{labels.sampleLink}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                    <span className="rounded-lg bg-primary px-3 py-2 text-on-primary">{labels.sampleButton}</span>
                    <span className="rounded-lg bg-accent px-3 py-2 text-on-accent">{labels.sampleSecondary}</span>
                    <span className="rounded-full bg-accent-soft px-3 py-2 text-accent-text">{labels.sampleBadge}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
