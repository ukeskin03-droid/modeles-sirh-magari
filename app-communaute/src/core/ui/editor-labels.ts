import type { Translator } from "@/core/i18n/translate";
import { listMedia, mediaUrl } from "@/core/media/service";
import type { EditorImage, EditorLabels } from "./RichTextEditor";

/** Les textes de l'éditeur de contenu riche, lus dans les libellés. */
export function editorLabels(t: Translator): EditorLabels {
  const keys = [
    "visual", "markdown", "preview", "toolbar", "bold", "italic", "heading2", "heading3", "bulletList", "orderedList", "quote", "link", "linkPrompt",
    "unlink", "table", "addRow", "addColumn", "deleteRow", "deleteColumn", "deleteTable", "image", "imageEmpty", "undo", "redo", "previewEmpty",
  ] as const;
  return Object.fromEntries(keys.map((key) => [key, t(`core.editor.${key}`)])) as EditorLabels;
}

/** Les images de la médiathèque, pour le bouton « Image » de l'éditeur. */
export async function editorImages(): Promise<EditorImage[]> {
  return (await listMedia()).map((media) => ({ url: mediaUrl(media), alt: media.alt, name: media.filename }));
}
