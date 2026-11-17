/**
 * BASE DE CONNAISSANCE — import en masse d'articles : un lot de fichiers Markdown, au
 * même format que le dossier articles/ d'un pack (voir pack.ts). Le nom de chaque fichier
 * donne l'identifiant stable de l'article.
 */
import { categoryIdsByPath, listCategories } from "@/core/categories/service";
import { slugify } from "@/core/content/text";
import { db } from "@/core/db/client";
import { decodeText } from "@/core/import/files";
import type { ImportContext, ImportFormatDefinition, ImportRow, UploadedFile } from "@/core/modules/types";
import { importArticles, parseArticleFile, type ParsedArticle } from "./pack";

async function analyse(files: UploadedFile[], context: ImportContext) {
  const { t } = context;
  const warnings: string[] = [];
  const rows: (ImportRow & { parsed: ParsedArticle })[] = [];
  const categoryIds = categoryIdsByPath(await listCategories());

  for (const file of files) {
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      warnings.push(t("core.import.unsupported", { file: file.name, accept: ".md" }));
      continue;
    }
    const slug = slugify(file.name.replace(/\.[^.]+$/, ""));
    const parsed = parseArticleFile(slug, decodeText(file.data), categoryIds);
    const existing = await db().article.findUnique({ where: { slug }, select: { id: true } });
    const status: ImportRow["status"] = parsed.issues.length > 0 ? "error" : parsed.warnings.length > 0 ? "warning" : "ok";
    rows.push({
      id: file.name,
      cells: [file.name, parsed.input.title, t(`knowledge.status.${parsed.input.status}`), status === "error" ? "" : t(existing ? "core.import.update" : "core.import.create")],
      status,
      messages: [...parsed.issues, ...parsed.warnings].map((issue) => `${file.name} : ${t(issue.key, issue.params)}`),
      parsed,
    });
  }
  return { rows, warnings };
}

export const articlesImportFormat: ImportFormatDefinition = {
  id: "knowledge.articles",
  labelKey: "knowledge.import.title",
  descriptionKey: "knowledge.import.description",
  accept: ".md,.markdown,.txt",
  multiple: true,
  action: "knowledge.manage",

  templates: [
    {
      filename: "modele_article.md",
      labelKey: "knowledge.import.template",
      contentType: "text/markdown; charset=utf-8",
      build: () =>
        [
          "---",
          'title: "[EXEMPLE À REMPLACER] Titre du contenu"',
          'summary: "Résumé en une ou deux phrases."',
          "category: ",
          "tags: [premier-mot-cle, second-mot-cle]",
          "status: draft",
          "related: []",
          "---",
          "",
          "Le texte, en Markdown.",
          "",
          "## Un titre de partie",
          "",
          "- un point",
          "- un autre point",
          "",
        ].join("\n"),
    },
  ],

  async preview(files, context) {
    const { rows, warnings } = await analyse(files, context);
    const { t } = context;
    return {
      headers: [t("knowledge.import.col.file"), t("knowledge.admin.col.title"), t("knowledge.admin.col.status"), t("knowledge.import.col.result")],
      rows: rows.map(({ id, cells, status, messages }) => ({ id, cells, status, messages })),
      warnings,
    };
  },

  async commit(files, excluded, context) {
    const { rows, warnings } = await analyse(files, context);
    const kept = rows.filter((row) => row.status !== "error" && !excluded.has(row.id)).map((row) => ({ ...row.parsed, warnings: [] }));
    const report = await importArticles(kept, context.t);
    return { created: report.created, updated: report.updated, unchanged: report.unchanged, warnings: [...warnings, ...report.warnings] };
  },
};
