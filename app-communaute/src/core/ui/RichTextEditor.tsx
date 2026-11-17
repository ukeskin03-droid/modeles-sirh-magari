"use client";

/**
 * ÉDITEUR DE CONTENU RICHE
 *
 * Trois vues sur le même texte :
 *   - « Visuel » : on met en forme avec des boutons, comme dans un traitement de texte ;
 *   - « Markdown » : on voit et on modifie le texte tel qu'il est enregistré ;
 *   - « Aperçu » : le rendu exact que verront les lecteurs.
 *
 * Le texte est toujours enregistré en Markdown (champ caché du formulaire). L'éditeur
 * visuel repose sur la bibliothèque Tiptap. S'exécute dans le navigateur.
 */
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Markdown as MarkdownExtension } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { INPUT_CLASS } from "./elements";
import { Markdown } from "./Markdown";

export type EditorImage = { url: string; alt: string; name: string };

export type EditorLabels = {
  visual: string;
  markdown: string;
  preview: string;
  toolbar: string;
  bold: string;
  italic: string;
  heading2: string;
  heading3: string;
  bulletList: string;
  orderedList: string;
  quote: string;
  link: string;
  linkPrompt: string;
  unlink: string;
  table: string;
  addRow: string;
  addColumn: string;
  deleteRow: string;
  deleteColumn: string;
  deleteTable: string;
  image: string;
  imageEmpty: string;
  undo: string;
  redo: string;
  previewEmpty: string;
};

type Mode = "visual" | "markdown" | "preview";

/** Le texte produit par l'éditeur, sans lignes vides superflues. */
const tidy = (markdown: string) => markdown.replace(/\n{3,}/g, "\n\n").trim();

const TOOL = "inline-flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-40 aria-pressed:bg-primary-soft aria-pressed:text-primary-text";

export function RichTextEditor({
  name,
  label,
  hint,
  defaultValue,
  images,
  labels,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
  /** Images de la médiathèque, proposées par le bouton « Image » */
  images: EditorImage[];
  labels: EditorLabels;
}) {
  const [mode, setMode] = useState<Mode>("visual");
  const [markdown, setMarkdown] = useState(defaultValue);
  const [showImages, setShowImages] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), TableKit, Image, MarkdownExtension],
    content: defaultValue,
    contentType: "markdown",
    // Next.js prépare d'abord la page côté serveur : l'éditeur ne démarre qu'ensuite, dans le navigateur.
    immediatelyRender: false,
    editorProps: { attributes: { class: "markdown min-h-64 px-4 py-3 outline-none", role: "textbox", "aria-multiline": "true", "aria-label": label } },
    onUpdate: ({ editor: current }) => setMarkdown(tidy(current.getMarkdown())),
  });

  // État des boutons (actif ou non), recalculé à chaque déplacement du curseur.
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bullet: current.isActive("bulletList"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            link: current.isActive("link"),
            table: current.isActive("table"),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });

  const switchTo = (next: Mode) => {
    // En revenant au mode visuel, on recharge le texte éventuellement modifié en Markdown.
    if (next === "visual" && mode !== "visual") editor?.commands.setContent(markdown, { contentType: "markdown" });
    setShowImages(false);
    setMode(next);
  };

  const setLink = () => {
    if (!editor) return;
    if (active?.link) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt(labels.linkPrompt, "https://");
    if (url && /^(https?:\/\/|\/|mailto:)/.test(url.trim())) editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const tool = (title: string, content: string, onClick: () => void, pressed?: boolean, disabled?: boolean) => (
    // onMouseDown : cliquer sur un bouton ne retire pas le curseur du texte en cours de saisie.
    <button type="button" title={title} aria-label={title} aria-pressed={pressed} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className={TOOL}>
      <span aria-hidden="true">{content}</span>
    </button>
  );

  const id = `editeur-${name}`;
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        <div role="tablist" aria-labelledby={`${id}-label`} className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-sm">
          {(["visual", "markdown", "preview"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => switchTo(value)}
              className={`min-h-8 rounded-md px-3 font-medium ${mode === value ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg"}`}
            >
              {labels[value]}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name={name} value={markdown} />

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {mode === "visual" && (
          <>
            <div role="toolbar" aria-label={labels.toolbar} className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-2/60 px-2 py-1">
              {tool(labels.bold, "G", () => editor?.chain().focus().toggleBold().run(), active?.bold)}
              {tool(labels.italic, "I", () => editor?.chain().focus().toggleItalic().run(), active?.italic)}
              {tool(labels.heading2, "T1", () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active?.h2)}
              {tool(labels.heading3, "T2", () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active?.h3)}
              {tool(labels.bulletList, "• —", () => editor?.chain().focus().toggleBulletList().run(), active?.bullet)}
              {tool(labels.orderedList, "1. —", () => editor?.chain().focus().toggleOrderedList().run(), active?.ordered)}
              {tool(labels.quote, "❝", () => editor?.chain().focus().toggleBlockquote().run(), active?.quote)}
              {tool(active?.link ? labels.unlink : labels.link, "🔗", setLink, active?.link)}
              {tool(labels.table, "▦", () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
              {tool(labels.image, "🖼", () => setShowImages((shown) => !shown), showImages)}
              <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
              {tool(labels.undo, "↶", () => editor?.chain().focus().undo().run(), undefined, !active?.canUndo)}
              {tool(labels.redo, "↷", () => editor?.chain().focus().redo().run(), undefined, !active?.canRedo)}
              {active?.table && (
                <span className="flex w-full flex-wrap items-center gap-1 border-t border-line pt-1 text-xs">
                  {(
                    [
                      [labels.addRow, () => editor?.chain().focus().addRowAfter().run()],
                      [labels.addColumn, () => editor?.chain().focus().addColumnAfter().run()],
                      [labels.deleteRow, () => editor?.chain().focus().deleteRow().run()],
                      [labels.deleteColumn, () => editor?.chain().focus().deleteColumn().run()],
                      [labels.deleteTable, () => editor?.chain().focus().deleteTable().run()],
                    ] as const
                  ).map(([text, run]) => (
                    <button key={text} type="button" onMouseDown={(event) => event.preventDefault()} onClick={run} className="min-h-8 rounded-md px-2 font-medium hover:bg-surface-2">
                      {text}
                    </button>
                  ))}
                </span>
              )}
            </div>
            {showImages && (
              <div className="border-b border-line bg-surface-2/60 p-3">
                {images.length === 0 ? (
                  <p className="text-sm text-muted">{labels.imageEmpty}</p>
                ) : (
                  <ul className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                    {images.map((image) => (
                      <li key={image.url}>
                        <button
                          type="button"
                          title={image.name}
                          onClick={() => {
                            // L'image, puis un paragraphe vide : le curseur se retrouve après l'image,
                            // et la saisie suivante ne la remplace pas.
                            editor?.chain().focus().insertContent([{ type: "image", attrs: { src: image.url, alt: image.alt } }, { type: "paragraph" }]).run();
                            setShowImages(false);
                          }}
                          className="flex size-20 items-center justify-center overflow-hidden rounded-md border border-line bg-surface hover:border-primary-text"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- vignette de la médiathèque */}
                          <img src={image.url} alt={image.alt || image.name} className="max-h-full max-w-full object-contain" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <EditorContent editor={editor} />
          </>
        )}

        {mode === "markdown" && (
          <textarea
            aria-labelledby={`${id}-label`}
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            rows={16}
            spellCheck
            className={`${INPUT_CLASS} rounded-none border-0 font-mono`}
          />
        )}

        {mode === "preview" && <div className="min-h-64 px-4 py-3">{markdown.trim() ? <Markdown>{markdown}</Markdown> : <p className="text-sm text-muted">{labels.previewEmpty}</p>}</div>}
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}
