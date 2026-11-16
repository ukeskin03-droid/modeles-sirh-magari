/**
 * LIBELLÉS ET VOCABULAIRE — les textes de l'interface et leur personnalisation.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROLES } from "@/core/auth/roles";
import { createTranslator, mergeVocabulary } from "@/core/i18n/translate";
import { allLabels, defaultVocabulary } from "@/core/modules/registry";
import { FONT_KEYS } from "@/core/theme/fonts";

const vocabulary = { "news.item": { singular: "Actualité", plural: "Actualités" }, "aide.faq": { singular: "FAQ", plural: "FAQ" } };

describe("traducteur", () => {
  const t = createTranslator(
    {
      "a.simple": "Bonjour {name}",
      "a.terms": "{termes:news.item} — {terme:news.item} — {termes_min:news.item} — {terme_min:news.item}",
      "a.acronym": "Voir la {terme_min:aide.faq}",
    },
    vocabulary,
  );

  it("remplace les valeurs et les termes", () => {
    expect(t("a.simple", { name: "Camille" })).toBe("Bonjour Camille");
    expect(t("a.terms")).toBe("Actualités — Actualité — actualités — actualité");
  });

  it("ne met pas un sigle en minuscules", () => {
    expect(t("a.acronym")).toBe("Voir la FAQ");
  });

  it("signale visiblement un libellé manquant, sans planter", () => {
    expect(t("inexistant")).toBe("⟦inexistant⟧");
  });

  it("applique le vocabulaire de la communauté et ignore les termes inconnus", () => {
    const merged = mergeVocabulary(vocabulary, {
      "news.item": { singular: "Info syndic", plural: "Infos syndic" },
      "module.absent": { singular: "X", plural: "Y" },
    });
    expect(merged["news.item"].plural).toBe("Infos syndic");
    expect(merged["module.absent"]).toBeUndefined();
    const custom = createTranslator({ menu: "{termes:news.item}" }, merged);
    expect(custom("menu")).toBe("Infos syndic");
  });
});

/** Liste tous les fichiers de code d'un dossier. */
function sourceFiles(folder: string): string[] {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("libellés de l'application", () => {
  const labels = allLabels();

  it("tous les libellés utilisés dans le code existent", () => {
    // On repère t("…"), titleFrom("…"), coreLabels["…"] et les rubriques labelKey / nameKey / descriptionKey.
    const patterns = [
      /\bt\(\s*"([^"]+)"/g,
      /\btitleFrom\(\s*"([^"]+)"/g,
      /\bcoreLabels\[\s*"([^"]+)"\s*\]/g,
      /\b(?:labelKey|nameKey|descriptionKey):\s*"([^"]+)"/g,
    ];
    const missing: string[] = [];
    for (const file of sourceFiles("src")) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
          if (!(match[1] in labels)) missing.push(`${file} : ${match[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("les familles de libellés construites dynamiquement sont complètes", () => {
    const expected = [
      ...ROLES.map((role) => `core.role.${role}`),
      ...FONT_KEYS.map((font) => `core.font.${font}`),
      ...["pending", "running", "done", "failed", "sent"].map((status) => `core.status.${status}`),
      ...["active", "pending", "disabled"].map((status) => `core.admin.users.status.${status}`),
      ...["email-taken", "invalid-email", "invalid-name", "invalid-role", "last-admin", "self-change", "unknown-user", "already-installed"].map(
        (reason) => `core.admin.users.error.${reason}`,
      ),
      ...["unknown-module", "last-active-module", "missing-requirement"].map((reason) => `core.admin.modules.error.${reason}`),
    ];
    expect(expected.filter((key) => !(key in labels))).toEqual([]);
  });

  it("chaque terme référencé dans un libellé est déclaré par un module", () => {
    const terms = defaultVocabulary();
    const unknown: string[] = [];
    for (const [key, text] of Object.entries(labels)) {
      for (const match of text.matchAll(/\{(?:terme|termes|terme_min|termes_min):([^}]+)\}/g)) {
        if (!(match[1] in terms)) unknown.push(`${key} → ${match[1]}`);
      }
    }
    expect(unknown).toEqual([]);
  });
});
