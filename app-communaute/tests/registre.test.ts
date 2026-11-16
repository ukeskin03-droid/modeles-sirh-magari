/**
 * REGISTRE — cohérence des fiches de modules et respect des règles d'architecture.
 * Ces tests empêchent le code de dériver au fil des lots.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { allModules, registryProblems } from "@/core/modules/registry";

function sourceFiles(folder: string): string[] {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const normalize = (file: string) => file.split(path.sep).join("/");
const importsOf = (file: string) => [...fs.readFileSync(file, "utf8").matchAll(/from\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1] ?? m[2]);

describe("fiches de modules", () => {
  it("sont toutes correctement remplies", () => {
    expect(registryProblems()).toEqual([]);
  });

  it("par défaut : actualités et quiz actifs, base de connaissance désactivée", () => {
    const defaults = Object.fromEntries(allModules().map((module) => [module.key, module.defaultEnabled]));
    expect(defaults).toEqual({ news: true, quiz: true, knowledge: false });
  });
});

describe("règles de dépendance", () => {
  it("le moteur n'importe aucun module, et ne lit la liste des modules qu'à un seul endroit", () => {
    const violations: string[] = [];
    for (const file of sourceFiles("src/core")) {
      for (const imported of importsOf(file)) {
        if (imported.startsWith("@/modules/")) violations.push(`${normalize(file)} importe ${imported}`);
        if (imported.startsWith("@/app/")) violations.push(`${normalize(file)} importe ${imported}`);
        if (imported === "@/registry" && normalize(file) !== "src/core/modules/registry.ts") {
          violations.push(`${normalize(file)} importe @/registry (réservé à src/core/modules/registry.ts)`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("un module n'importe jamais un autre module", () => {
    const violations: string[] = [];
    for (const current of allModules()) {
      for (const file of sourceFiles(`src/modules/${current.key}`)) {
        for (const imported of importsOf(file)) {
          const other = imported.match(/^@\/modules\/([^/]+)/)?.[1];
          if (other && other !== current.key) violations.push(`${normalize(file)} importe ${imported}`);
          if (imported === "@/registry" || imported.startsWith("@/app/")) violations.push(`${normalize(file)} importe ${imported}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("aucun terme métier n'apparaît dans le code", () => {
    // Les thématiques ne doivent exister que dans les packs (seed/packs), jamais dans src/.
    const forbidden = /peopledoc|copropri|syndic|salari|ukg|hrsd/i;
    const offenders = sourceFiles("src").filter((file) => forbidden.test(fs.readFileSync(file, "utf8")));
    expect(offenders.map(normalize)).toEqual([]);
  });
});

describe("pages", () => {
  const pages = sourceFiles("src/app").filter((file) => path.basename(file) === "page.tsx").map(normalize);

  it("toutes les pages passent par une fabrique de pages (contrôle d'accès)", () => {
    const unguarded = pages.filter(
      (file) => !/export default (publicPage|memberPage|adminPage|modulePage|moduleAdminPage)\(/.test(fs.readFileSync(file, "utf8")),
    );
    expect(unguarded).toEqual([]);
  });

  it("les pages d'un module vérifient que CE module est actif", () => {
    const problems: string[] = [];
    for (const current of allModules()) {
      const reader = pages.filter((file) => file.startsWith(`src/app/(membres)/${current.routeSegment}/`));
      const admin = pages.filter((file) => file.startsWith(`src/app/(membres)/admin/${current.routeSegment}/`));
      if (reader.length === 0) problems.push(`${current.key} : aucune page lecteur`);
      for (const file of reader) {
        if (!fs.readFileSync(file, "utf8").includes(`export default modulePage("${current.key}"`)) problems.push(file);
      }
      for (const file of admin) {
        if (!fs.readFileSync(file, "utf8").includes(`export default moduleAdminPage("${current.key}"`)) problems.push(file);
      }
    }
    expect(problems).toEqual([]);
  });
});
