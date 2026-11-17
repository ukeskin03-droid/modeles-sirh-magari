/**
 * QUIZ — import en masse de questions depuis un fichier CSV ou JSON.
 *
 * CSV : une question par ligne. Colonnes (la première ligne donne leurs noms) :
 *   ref ; type ; enonce ; reponse_1 … reponse_8 ; bonnes_reponses ; explication ;
 *   difficulte ; categorie
 * et, seulement si un module actif propose un lien depuis les questions (ex. la base de
 * connaissance), une colonne facultative de plus, déclarée par ce module (ex. article_lie).
 *
 *   type            : unique, multiple ou vrai_faux
 *   bonnes_reponses : les numéros des bonnes réponses (« 1 » ou « 1,3 ») ;
 *                     pour un vrai/faux : « vrai » ou « faux »
 *
 * JSON : une liste de questions, au même format que le fichier questions.json d'un pack.
 */
import { categoryIdsByPath, listCategories } from "@/core/categories/service";
import { db } from "@/core/db/client";
import { buildCsv, decodeText, parseCsv } from "@/core/import/files";
import { findContentType, linkedFieldsFor } from "@/core/modules/registry";
import type { ImportContext, ImportFormatDefinition, ImportPreview, ImportRow, UploadedFile } from "@/core/modules/types";
import { applyPackLinks } from "@/core/pack/links";
import { MAX_OPTIONS } from "./model";
import { importQuestions, isBlocking, parseQuestionRecord, type ParsedQuestion } from "./pack";

const HOST_TYPE = "quiz.question";
const BASE_COLUMNS = ["ref", "type", "enonce", ...Array.from({ length: MAX_OPTIONS }, (_, index) => `reponse_${index + 1}`), "bonnes_reponses", "explication", "difficulte", "categorie"];
const REQUIRED_COLUMNS = ["type", "enonce"];

const TYPE_ALIASES: Record<string, string> = {
  single: "single", unique: "single", choix_unique: "single",
  multiple: "multiple", choix_multiple: "multiple",
  truefalse: "truefalse", vrai_faux: "truefalse", "vrai/faux": "truefalse", vraifaux: "truefalse",
};
const TRUE_WORDS = new Set(["vrai", "true", "oui", "v", "1"]);
const FALSE_WORDS = new Set(["faux", "false", "non", "f", "0"]);

/** Colonnes de liens proposées par les modules actifs (nom de colonne → type de contenu visé). */
function linkedColumns(context: ImportContext) {
  return linkedFieldsFor(context.active, HOST_TYPE).map((field) => ({ column: field.importColumn, targetType: field.targetType }));
}

/** Une ligne de tableur → le même format « brut » qu'un élément de questions.json. */
function csvRowToRecord(values: Record<string, string>, links: ReturnType<typeof linkedColumns>): Record<string, unknown> {
  const type = TYPE_ALIASES[values.type?.toLowerCase().replace(/[\s-]+/g, "_") ?? ""] ?? values.type;
  const answers = (values.bonnes_reponses ?? "").toLowerCase().trim();
  const record: Record<string, unknown> = {
    ref: values.ref,
    type,
    statement: values.enonce,
    explanation: values.explication,
    difficulty: values.difficulte,
    category: values.categorie,
    links: links.flatMap(({ column, targetType }) => (values[column] ? [`${targetType}:${values[column]}`] : [])),
  };
  if (type === "truefalse") {
    record.answer = TRUE_WORDS.has(answers) ? true : FALSE_WORDS.has(answers) ? false : undefined;
  } else {
    const correct = new Set(answers.split(/[\s,;|]+/).filter(Boolean).map(Number));
    const labels = Array.from({ length: MAX_OPTIONS }, (_, index) => values[`reponse_${index + 1}`] ?? "");
    // On s'arrête à la dernière réponse renseignée : une case vide au milieu sera signalée.
    const last = labels.reduce((found, label, index) => (label ? index : found), -1);
    record.options = labels.slice(0, last + 1).map((label, index) => ({ label, correct: correct.has(index + 1) }));
  }
  return record;
}

type Analysed = { rows: (ImportRow & { parsed: ParsedQuestion })[]; warnings: string[] };

async function analyse(files: UploadedFile[], context: ImportContext): Promise<Analysed> {
  const { t } = context;
  const warnings: string[] = [];
  const rows: Analysed["rows"] = [];
  const categoryIds = categoryIdsByPath(await listCategories());
  const links = linkedColumns(context);

  for (const file of files) {
    const text = decodeText(file.data);
    const records: { line: number; raw: unknown }[] = [];

    if (file.name.toLowerCase().endsWith(".json")) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error(t("core.pack.notAList", { file: file.name }));
        parsed.forEach((raw, index) => records.push({ line: index + 1, raw }));
      } catch (error) {
        warnings.push(t("core.import.unreadable", { file: file.name, detail: error instanceof Error ? error.message : "" }));
        continue;
      }
    } else if (file.name.toLowerCase().endsWith(".csv")) {
      const table = parseCsv(text);
      if (table.error) {
        warnings.push(t("core.import.unreadable", { file: file.name, detail: table.error }));
        continue;
      }
      const missing = REQUIRED_COLUMNS.filter((column) => !table.headers.includes(column));
      if (missing.length > 0) {
        for (const column of missing) warnings.push(t("core.import.missingColumn", { file: file.name, column }));
        continue;
      }
      const known = new Set([...BASE_COLUMNS, ...links.map((link) => link.column)]);
      const ignored = table.headers.filter((header) => header && !known.has(header));
      if (ignored.length > 0) warnings.push(t("core.import.ignoredColumns", { file: file.name, columns: ignored.join(", ") }));
      for (const row of table.rows) records.push({ line: row.line, raw: csvRowToRecord(row.values, links) });
    } else {
      warnings.push(t("core.import.unsupported", { file: file.name, accept: ".csv, .json" }));
      continue;
    }
    if (records.length === 0) warnings.push(t("core.import.empty", { file: file.name }));

    for (const { line, raw } of records) {
      const parsed = parseQuestionRecord(raw, categoryIds);
      const where = t("core.import.line", { line });
      const messages = parsed.issues.map((issue) => `${where} : ${t(issue.key, issue.params)}`);
      let status: ImportRow["status"] = parsed.issues.some(isBlocking) ? "error" : parsed.issues.length > 0 ? "warning" : "ok";

      // Liens : le contenu visé doit exister. Sinon, la ligne reste importable, sans le lien.
      const validLinks: string[] = [];
      for (const link of parsed.links) {
        const [targetType, key] = [link.slice(0, link.indexOf(":")), link.slice(link.indexOf(":") + 1)];
        if (await findContentType(targetType, context.active)?.findByKey(key)) validLinks.push(link);
        else {
          messages.push(`${where} : ${t("core.import.linkedMissing", { key })}`);
          if (status === "ok") status = "warning";
        }
      }
      const existing = parsed.ref ? await db().question.findUnique({ where: { ref: parsed.ref }, select: { id: true } }) : null;
      rows.push({
        id: `${file.name}:${line}`,
        cells: [String(line), parsed.input.statement.slice(0, 140), t(`quiz.qtype.${parsed.input.type}`), status === "error" ? "" : t(existing ? "core.import.update" : "core.import.create")],
        status,
        messages,
        parsed: { ...parsed, links: validLinks },
      });
    }
  }
  return { rows, warnings };
}

/** Lignes d'exemple des modèles : fictives, à remplacer. */
const EXAMPLE_NOTE = "[EXEMPLE À REMPLACER]";

export const questionsImportFormat: ImportFormatDefinition = {
  id: "quiz.questions",
  labelKey: "quiz.import.title",
  descriptionKey: "quiz.import.description",
  accept: ".csv,.json",
  multiple: false,
  action: "quiz.manage",

  templates: [
    {
      filename: "modele_questions.csv",
      labelKey: "quiz.import.template.csv",
      contentType: "text/csv; charset=utf-8",
      build: (context) => {
        const links = linkedColumns(context).map((link) => link.column);
        const headers = ["ref", "type", "enonce", "reponse_1", "reponse_2", "reponse_3", "reponse_4", "bonnes_reponses", "explication", "difficulte", "categorie", ...links];
        const tail = (category: string) => ["Explication affichée avec la correction.", "1", category, ...links.map(() => "")];
        return buildCsv(headers, [
          ["q-exemple-1", "unique", `${EXAMPLE_NOTE} Question à choix unique ?`, "Première réponse", "Deuxième réponse", "Troisième réponse", "", "1", ...tail("")],
          ["q-exemple-2", "multiple", `${EXAMPLE_NOTE} Question à choix multiple ?`, "Première réponse", "Deuxième réponse", "Troisième réponse", "Quatrième réponse", "1,3", ...tail("")],
          ["q-exemple-3", "vrai_faux", `${EXAMPLE_NOTE} Affirmation à juger.`, "", "", "", "", "vrai", ...tail("")],
        ]);
      },
    },
    {
      filename: "modele_questions.json",
      labelKey: "quiz.import.template.json",
      contentType: "application/json; charset=utf-8",
      build: (context) => {
        const links = linkedColumns(context);
        const example = links.length > 0 ? { links: links.map((link) => `${link.targetType}:identifiant-du-contenu`) } : {};
        return `${JSON.stringify(
          [
            { ref: "q-exemple-1", type: "single", statement: `${EXAMPLE_NOTE} Question à choix unique ?`, options: [{ label: "Première réponse", correct: true }, { label: "Deuxième réponse", correct: false }], explanation: "Explication affichée avec la correction.", difficulty: 1, category: "", ...example },
            { ref: "q-exemple-2", type: "multiple", statement: `${EXAMPLE_NOTE} Question à choix multiple ?`, options: [{ label: "Première réponse", correct: true }, { label: "Deuxième réponse", correct: false }, { label: "Troisième réponse", correct: true }], explanation: "", difficulty: 2, category: "" },
            { ref: "q-exemple-3", type: "truefalse", statement: `${EXAMPLE_NOTE} Affirmation à juger.`, answer: true, explanation: "", difficulty: 3, category: "" },
          ],
          null,
          2,
        )}\n`;
      },
    },
  ],

  async preview(files, context): Promise<ImportPreview> {
    const { rows, warnings } = await analyse(files, context);
    const { t } = context;
    return {
      headers: [t("quiz.import.col.line"), t("quiz.questions.col.statement"), t("quiz.questions.col.type"), t("quiz.import.col.result")],
      rows: rows.map(({ id, cells, status, messages }) => ({ id, cells, status, messages })),
      warnings,
    };
  },

  async commit(files, excluded, context) {
    const { rows, warnings } = await analyse(files, context);
    const kept = rows.filter((row) => row.status !== "error" && !excluded.has(row.id)).map((row) => ({ ...row.parsed, issues: [] }));
    const report = await importQuestions(kept, context.t, files[0]?.name ?? "");
    const linkWarnings = await applyPackLinks(report.links, context.t);
    return { created: report.created, updated: report.updated, unchanged: report.unchanged, warnings: [...warnings, ...report.warnings, ...linkWarnings] };
  },
};
