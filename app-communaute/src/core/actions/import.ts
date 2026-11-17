"use server";

/**
 * ACTION D'IMPORT EN MASSE — en deux temps : prévisualiser, puis confirmer.
 *
 * Le format (questions, articles…) est fourni par le module concerné, via le registre.
 * Seuls les formats des modules ACTIFS existent : importer des articles dans une
 * communauté sans base de connaissance est donc impossible.
 */
import { refresh } from "next/cache";
import { inTransaction } from "@/core/db/client";
import { importFormatsFor } from "@/core/modules/registry";
import { getActiveModules, getT, requireViewer, viewerCan } from "@/core/request/context";
import type { FlowState } from "@/core/ui/UploadPreviewFlow";
import { deleteTempFile, filesFromForm, readTempFiles, saveTempFiles } from "@/core/uploads/temp";

const MAX_BYTES = 20 * 1024 * 1024;

export async function bulkImportAction(formatId: string, _state: FlowState, data: FormData): Promise<FlowState> {
  await requireViewer();
  const [active, t] = await Promise.all([getActiveModules(), getT()]);
  const format = importFormatsFor(active).find((candidate) => candidate.id === formatId);
  if (!format || !(await viewerCan(format.action))) return { phase: "error", message: t("core.flow.expired") };

  const intent = String(data.get("intent") ?? "");
  const token = String(data.get("token") ?? "");
  const context = { t, active };

  if (intent === "cancel") {
    await deleteTempFile(token);
    return null;
  }

  if (intent === "confirm") {
    const files = await readTempFiles(token);
    if (!files) return { phase: "error", message: t("core.flow.expired") };
    const excluded = new Set(data.getAll("excluded").map(String));
    // Tout ou rien : si une ligne provoque une erreur inattendue, rien n'est enregistré.
    const result = await inTransaction(() => format.commit(files, excluded, context));
    await deleteTempFile(token);
    refresh();
    return { phase: "done", message: t("core.admin.import.done", { created: result.created, updated: result.updated, unchanged: result.unchanged }), details: result.warnings };
  }

  const files = await filesFromForm(data, "files");
  if (files.length === 0) return { phase: "error", message: t("core.flow.noFile") };
  if (files.reduce((total, file) => total + file.data.byteLength, 0) > MAX_BYTES) return { phase: "error", message: t("core.flow.tooLarge", { max: MAX_BYTES / 1024 / 1024 }) };

  const preview = await format.preview(files, context);
  if (preview.rows.length === 0) return { phase: "error", message: preview.warnings.join(" ") || t("core.flow.noFile") };
  return {
    phase: "preview",
    token: await saveTempFiles(files),
    summary: [],
    tables: [{ title: t(format.labelKey), headers: preview.headers, rows: preview.rows, selectable: true }],
    warnings: preview.warnings,
    canConfirm: preview.rows.some((row) => row.status !== "error"),
  };
}
