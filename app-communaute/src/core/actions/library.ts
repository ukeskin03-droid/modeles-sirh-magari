"use server";

/**
 * ACTIONS DE LA MÉDIATHÈQUE ET DES PACKS
 */
import { refresh } from "next/cache";
import { loadCommunity } from "@/core/community/service";
import { deleteMedia, MediaError, saveMedia, updateMediaAlt } from "@/core/media/service";
import { importPack } from "@/core/pack/import";
import { PackError } from "@/core/pack/schema";
import { PACK_MAX_UPLOAD_BYTES, readPackZip } from "@/core/pack/zip";
import { getT, requireCan } from "@/core/request/context";
import type { FormState } from "@/core/ui/forms";
import type { FlowState } from "@/core/ui/UploadPreviewFlow";
import { deleteTempFile, filesFromForm, readTempFile, saveTempFile } from "@/core/uploads/temp";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

// ── Médiathèque ──────────────────────────────────────────────────────────────

export async function uploadMediaAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.media.manage");
  const t = await getT();
  const files = await filesFromForm(data, "files");
  if (files.length === 0) return { error: t("core.flow.noFile") };

  let added = 0;
  const errors: string[] = [];
  for (const file of files) {
    try {
      await saveMedia({ filename: file.name, data: file.data });
      added++;
    } catch (error) {
      if (!(error instanceof MediaError)) throw error;
      errors.push(t(`core.admin.media.error.${error.reason}`, { file: file.name }));
    }
  }
  refresh();
  if (added === 0) return { error: errors.join(" ") };
  return { notice: [t("core.admin.media.added", { count: added }), ...errors].join(" ") };
}

export async function updateMediaAltAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.media.manage");
  await updateMediaAlt(text(data, "id"), text(data, "alt"));
  refresh();
  return { notice: (await getT())("core.form.saved") };
}

export async function deleteMediaAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.media.manage");
  const id = text(data, "id");
  const community = await loadCommunity();
  // Le logo et le favicon se changent depuis l'écran « Identité ».
  if (id === community.logoMediaId || id === community.faviconMediaId) return { error: (await getT())("core.admin.media.error.inUse") };
  await deleteMedia(id);
  refresh();
  return null;
}

// ── Import d'un pack, en deux temps ──────────────────────────────────────────

export async function packImportAction(_state: FlowState, data: FormData): Promise<FlowState> {
  await requireCan("core.community.configure");
  const t = await getT();
  const intent = text(data, "intent");
  const token = text(data, "token");

  if (intent === "cancel") {
    await deleteTempFile(token);
    return null;
  }

  try {
    if (intent === "confirm") {
      const archive = await readTempFile(token);
      if (!archive) return { phase: "error", message: t("core.flow.expired") };
      const report = await importPack(readPackZip(archive));
      await deleteTempFile(token);
      refresh();
      return {
        phase: "done",
        message: t("core.admin.pack.done"),
        details: [
          ...report.sections.map((section) => `${section.label} : ${section.created} créé(s), ${section.updated} modifié(s), ${section.unchanged} inchangé(s)`),
          ...report.warnings,
        ],
      };
    }

    // Premier temps : on analyse le fichier et on SIMULE l'import, sans rien modifier.
    const [file] = await filesFromForm(data, "files");
    if (!file) return { phase: "error", message: t("core.flow.noFile") };
    if (file.data.byteLength > PACK_MAX_UPLOAD_BYTES) return { phase: "error", message: t("core.flow.tooLarge", { max: PACK_MAX_UPLOAD_BYTES / 1024 / 1024 }) };
    const report = await importPack(readPackZip(file.data), { dryRun: true });
    return {
      phase: "preview",
      token: await saveTempFile(file.data),
      summary: [
        t("core.admin.pack.summary.community", { name: report.communityName }),
        t("core.admin.pack.summary.modules", { modules: report.activeModules.join(", ") }),
        t("core.admin.pack.summary.media", report.media),
        ...(report.sections.length === 0 ? [t("core.admin.pack.summary.noContent")] : []),
      ],
      tables:
        report.sections.length === 0
          ? []
          : [
              {
                title: t("core.admin.pack.table.title"),
                headers: [t("core.admin.pack.table.section"), t("core.admin.pack.table.created"), t("core.admin.pack.table.updated"), t("core.admin.pack.table.unchanged"), t("core.admin.pack.table.status")],
                selectable: false,
                rows: report.sections.map((section) => ({
                  id: section.id,
                  cells: [section.label, String(section.created), String(section.updated), String(section.unchanged), ""],
                  status: "ok" as const,
                  messages: [],
                })),
              },
            ],
      warnings: report.warnings,
      canConfirm: true,
    };
  } catch (error) {
    if (error instanceof PackError) return { phase: "error", message: error.details.join(" ") };
    throw error;
  }
}
