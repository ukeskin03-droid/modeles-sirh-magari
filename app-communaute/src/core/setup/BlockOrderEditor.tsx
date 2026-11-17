"use client";

/**
 * ÉTAPE « PAGE D'ACCUEIL » — choix et ordre des blocs. On réordonne par glisser-déposer
 * ou avec les flèches. La liste des blocs affichés, dans l'ordre, est transmise au
 * serveur par le champ caché « blocks ».
 */
import { useRef, useState } from "react";
import { buttonClass } from "@/core/ui/elements";

type Block = { id: string; label: string; enabled: boolean };

export function BlockOrderEditor({ initial, labels }: { initial: Block[]; labels: { show: string; moveUp: string; moveDown: string } }) {
  const [blocks, setBlocks] = useState(initial);
  const dragged = useRef<number | null>(null);

  const move = (from: number, to: number) =>
    setBlocks((current) => {
      if (to < 0 || to >= current.length || from === to) return current;
      const next = [...current];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });

  return (
    <div>
      <input type="hidden" name="blocks" value={JSON.stringify(blocks.filter((block) => block.enabled).map((block) => block.id))} />
      <ol className="space-y-2">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            draggable
            onDragStart={() => void (dragged.current = index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged.current !== null) move(dragged.current, index);
              dragged.current = null;
            }}
            className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2"
          >
            <span className="cursor-grab select-none text-muted" aria-hidden="true">
              ⠿
            </span>
            <label className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={block.enabled}
                onChange={(event) => setBlocks((current) => current.map((item) => (item.id === block.id ? { ...item, enabled: event.target.checked } : item)))}
                aria-label={`${labels.show} : ${block.label}`}
                className="size-4 accent-(--c-primary)"
              />
              <span className={block.enabled ? "" : "text-muted line-through"}>{block.label}</span>
            </label>
            <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`${labels.moveUp} : ${block.label}`} title={labels.moveUp} className={buttonClass("ghost", "", "sm")}>
              ↑
            </button>
            <button type="button" disabled={index === blocks.length - 1} onClick={() => move(index, index + 1)} aria-label={`${labels.moveDown} : ${block.label}`} title={labels.moveDown} className={buttonClass("ghost", "", "sm")}>
              ↓
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
