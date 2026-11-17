"use client";

/**
 * ÉTAPE « CATÉGORIES » — éditeur d'arborescence sur deux niveaux.
 *
 * On réordonne par glisser-déposer, ou avec les flèches (accessible au clavier). Une
 * sous-catégorie peut être glissée vers une autre catégorie. L'arborescence complète est
 * transmise au serveur par le champ caché « tree ».
 */
import { useRef, useState } from "react";
import { buttonClass, INPUT_CLASS } from "@/core/ui/elements";

type Child = { key: string; id?: string; name: string };
type Parent = Child & { children: Child[] };
export type InitialCategory = { id: string; name: string; children: { id: string; name: string }[] };

export type CategoryEditorLabels = {
  add: string;
  addChild: string;
  name: string;
  childName: string;
  empty: string;
  drag: string;
  moveUp: string;
  moveDown: string;
  remove: string;
};

/** Ce qui est en cours de déplacement : une catégorie, ou une sous-catégorie. */
type Dragged = { parent: number; child: number | null };

let counter = 0;
const newKey = () => `nouvelle-${counter++}`;

export function CategoryTreeEditor({ initial, labels }: { initial: InitialCategory[]; labels: CategoryEditorLabels }) {
  const [tree, setTree] = useState<Parent[]>(initial.map((parent) => ({ key: parent.id, id: parent.id, name: parent.name, children: parent.children.map((child) => ({ key: child.id, id: child.id, name: child.name })) })));
  const dragged = useRef<Dragged | null>(null);

  const update = (change: (draft: Parent[]) => void) =>
    setTree((current) => {
      const draft = current.map((parent) => ({ ...parent, children: [...parent.children] }));
      change(draft);
      return draft;
    });

  const moveParent = (from: number, to: number) => update((draft) => { if (to >= 0 && to < draft.length) draft.splice(to, 0, ...draft.splice(from, 1)); });
  const moveChild = (fromParent: number, fromChild: number, toParent: number, toChild: number) =>
    update((draft) => {
      const [item] = draft[fromParent].children.splice(fromChild, 1);
      if (item) draft[toParent].children.splice(Math.max(0, Math.min(toChild, draft[toParent].children.length)), 0, item);
    });

  /** Dépôt sur une catégorie (child = null) ou sur une sous-catégorie. */
  const drop = (target: Dragged) => {
    const source = dragged.current;
    dragged.current = null;
    if (!source) return;
    if (source.child === null) {
      if (target.child === null) moveParent(source.parent, target.parent);
    } else {
      moveChild(source.parent, source.child, target.parent, target.child ?? tree[target.parent].children.length);
    }
  };

  const dragProps = (position: Dragged) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      event.stopPropagation();
      dragged.current = position;
      event.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (event: React.DragEvent) => event.preventDefault(),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      drop(position);
    },
  });

  const arrows = (label: string, onUp: () => void, onDown: () => void, first: boolean, last: boolean, onRemove: () => void) => (
    <span className="flex shrink-0 gap-1">
      <button type="button" disabled={first} onClick={onUp} aria-label={`${labels.moveUp} : ${label}`} title={labels.moveUp} className={buttonClass("ghost", "", "sm")}>
        ↑
      </button>
      <button type="button" disabled={last} onClick={onDown} aria-label={`${labels.moveDown} : ${label}`} title={labels.moveDown} className={buttonClass("ghost", "", "sm")}>
        ↓
      </button>
      <button type="button" onClick={onRemove} aria-label={`${labels.remove} : ${label}`} title={labels.remove} className={buttonClass("ghost", "", "sm")}>
        ✕
      </button>
    </span>
  );

  const payload = tree.map((parent) => ({ id: parent.id, name: parent.name, children: parent.children.map((child) => ({ id: child.id, name: child.name })) }));

  return (
    <div>
      <input type="hidden" name="tree" value={JSON.stringify(payload)} />
      <p className="mb-3 text-sm text-muted">{tree.length === 0 ? labels.empty : labels.drag}</p>
      <ul className="space-y-3">
        {tree.map((parent, parentIndex) => (
          <li key={parent.key} {...dragProps({ parent: parentIndex, child: null })} className="rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="cursor-grab select-none px-1 text-muted" aria-hidden="true">
                ⠿
              </span>
              <input
                value={parent.name}
                onChange={(event) => update((draft) => void (draft[parentIndex].name = event.target.value))}
                aria-label={labels.name}
                placeholder={labels.name}
                maxLength={80}
                required
                className={`${INPUT_CLASS} min-w-0 flex-1 font-semibold`}
              />
              {arrows(parent.name, () => moveParent(parentIndex, parentIndex - 1), () => moveParent(parentIndex, parentIndex + 1), parentIndex === 0, parentIndex === tree.length - 1, () => update((draft) => void draft.splice(parentIndex, 1)))}
            </div>
            <ul className="ml-6 mt-2 space-y-2 border-l border-line pl-3">
              {parent.children.map((child, childIndex) => (
                <li key={child.key} {...dragProps({ parent: parentIndex, child: childIndex })} className="flex items-center gap-2">
                  <span className="cursor-grab select-none px-1 text-muted" aria-hidden="true">
                    ⠿
                  </span>
                  <input
                    value={child.name}
                    onChange={(event) => update((draft) => void (draft[parentIndex].children[childIndex].name = event.target.value))}
                    aria-label={labels.childName}
                    placeholder={labels.childName}
                    maxLength={80}
                    required
                    className={`${INPUT_CLASS} min-w-0 flex-1`}
                  />
                  {arrows(
                    child.name,
                    () => moveChild(parentIndex, childIndex, parentIndex, childIndex - 1),
                    () => moveChild(parentIndex, childIndex, parentIndex, childIndex + 1),
                    childIndex === 0,
                    childIndex === parent.children.length - 1,
                    () => update((draft) => void draft[parentIndex].children.splice(childIndex, 1)),
                  )}
                </li>
              ))}
              <li>
                <button type="button" onClick={() => update((draft) => void draft[parentIndex].children.push({ key: newKey(), name: "" }))} className={buttonClass("ghost", "", "sm")}>
                  + {labels.addChild}
                </button>
              </li>
            </ul>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => update((draft) => void draft.push({ key: newKey(), name: "", children: [] }))} className={buttonClass("secondary", "mt-4")}>
        + {labels.add}
      </button>
    </div>
  );
}
