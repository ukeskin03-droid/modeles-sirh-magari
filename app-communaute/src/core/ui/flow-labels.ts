import type { Translator } from "@/core/i18n/translate";
import type { FlowLabels } from "./UploadPreviewFlow";

/** Les textes du composant d'import en deux temps, lus dans les libellés. */
export function flowLabels(t: Translator, options: { multiple?: boolean } = {}): FlowLabels {
  return {
    drop: t(options.multiple ? "core.flow.dropMany" : "core.flow.drop"),
    browse: t("core.flow.browse"),
    analyze: t("core.flow.analyze"),
    confirm: t("core.flow.confirm"),
    cancel: t("core.flow.cancel"),
    restart: t("core.flow.restart"),
    include: t("core.flow.include"),
    statusOk: t("core.flow.status.ok"),
    statusWarning: t("core.flow.status.warning"),
    statusError: t("core.flow.status.error"),
    warnings: t("core.flow.warnings"),
    selected: t("core.flow.selected"),
  };
}
