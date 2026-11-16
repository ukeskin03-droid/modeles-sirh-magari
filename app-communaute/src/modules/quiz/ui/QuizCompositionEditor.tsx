"use client";

/**
 * Partie interactive du formulaire de quiz : la composition, soit à la main (choisir et
 * ordonner des questions de la banque), soit par règles de tirage. S'exécute dans le navigateur.
 *
 * Résultat transmis au serveur par des champs cachés : « selection », « questionIds » et « rules ».
 */
import { useState } from "react";
import { buttonClass, INPUT_CLASS } from "@/core/ui/elements";

export type BankQuestion = { id: string; statement: string; categoryId: string | null; categoryLabel: string; difficulty: number; typeLabel: string };
export type Rule = { categoryId: string; difficulty: string; count: number };

export type CompositionLabels = {
  selection: string;
  manual: string;
  rules: string;
  /** Contient « {count} » */
  selected: string;
  selectedEmpty: string;
  available: string;
  availableEmpty: string;
  filter: string;
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  /** Contient « {number} » */
  rule: string;
  ruleCategory: string;
  ruleDifficulty: string;
  anyDifficulty: string;
  ruleCount: string;
  addRule: string;
  /** Contient « {count} » */
  ruleAvailable: string;
  allCategories: string;
  difficulties: Record<string, string>;
};

const simplify = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function QuizCompositionEditor({
  bank,
  categories,
  categoryScopes,
  initialSelection,
  initialQuestionIds,
  initialRules,
  labels,
}: {
  bank: BankQuestion[];
  categories: { id: string; label: string }[];
  /** Pour chaque catégorie : elle-même et ses sous-catégories */
  categoryScopes: Record<string, string[]>;
  initialSelection: "manual" | "rules";
  initialQuestionIds: string[];
  initialRules: Rule[];
  labels: CompositionLabels;
}) {
  const [selection, setSelection] = useState(initialSelection);
  const [selectedIds, setSelectedIds] = useState(initialQuestionIds.filter((id) => bank.some((question) => question.id === id)));
  const [rules, setRules] = useState<Rule[]>(initialRules.length > 0 ? initialRules : [{ categoryId: "", difficulty: "", count: 5 }]);
  const [filter, setFilter] = useState("");

  const byId = new Map(bank.map((question) => [question.id, question]));
  const needle = simplify(filter);
  const available = bank.filter((question) => !selectedIds.includes(question.id) && (!needle || simplify(`${question.statement} ${question.categoryLabel}`).includes(needle)));

  const move = (index: number, delta: number) =>
    setSelectedIds((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const matching = (rule: Rule) =>
    bank.filter(
      (question) =>
        (!rule.difficulty || question.difficulty === Number(rule.difficulty)) &&
        (!rule.categoryId || (question.categoryId !== null && (categoryScopes[rule.categoryId] ?? []).includes(question.categoryId))),
    ).length;

  const updateRule = (index: number, change: Partial<Rule>) => setRules((current) => current.map((rule, position) => (position === index ? { ...rule, ...change } : rule)));

  return (
    <div className="space-y-4">
      <input type="hidden" name="selection" value={selection} />
      <input type="hidden" name="questionIds" value={JSON.stringify(selectedIds)} />
      <input type="hidden" name="rules" value={JSON.stringify(rules.map((rule) => ({ categoryId: rule.categoryId || null, difficulty: rule.difficulty ? Number(rule.difficulty) : null, count: rule.count })))} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.selection}</legend>
        <div className="flex flex-wrap gap-3">
          {(["manual", "rules"] as const).map((value) => (
            <label key={value} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-4 has-checked:border-primary-text has-checked:bg-primary-soft">
              <input type="radio" name="mode-de-composition" checked={selection === value} onChange={() => setSelection(value)} className="size-4 accent-(--c-primary)" />
              {value === "manual" ? labels.manual : labels.rules}
            </label>
          ))}
        </div>
      </fieldset>

      {selection === "manual" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="titre-selection" className="rounded-lg border border-line p-4">
            <h3 id="titre-selection" className="mb-3 text-sm font-semibold">
              {labels.selected.replace("{count}", String(selectedIds.length))}
            </h3>
            {selectedIds.length === 0 ? (
              <p className="text-sm text-muted">{labels.selectedEmpty}</p>
            ) : (
              <ol className="space-y-2">
                {selectedIds.map((id, index) => (
                  <li key={id} className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                    <span className="mt-0.5 w-5 shrink-0 text-muted tabular-nums">{index + 1}.</span>
                    <span className="min-w-0 flex-1 line-clamp-2">{byId.get(id)?.statement}</span>
                    <span className="flex shrink-0 gap-1">
                      <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${labels.moveUp} : ${index + 1}`} title={labels.moveUp} className={buttonClass("ghost", "", "sm")}>
                        ↑
                      </button>
                      <button type="button" disabled={index === selectedIds.length - 1} onClick={() => move(index, 1)} aria-label={`${labels.moveDown} : ${index + 1}`} title={labels.moveDown} className={buttonClass("ghost", "", "sm")}>
                        ↓
                      </button>
                      <button type="button" onClick={() => setSelectedIds((current) => current.filter((other) => other !== id))} aria-label={`${labels.remove} : ${index + 1}`} title={labels.remove} className={buttonClass("ghost", "", "sm")}>
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="titre-banque" className="rounded-lg border border-line p-4">
            <h3 id="titre-banque" className="mb-3 text-sm font-semibold">
              {labels.available}
            </h3>
            <input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label={labels.filter} placeholder={labels.filter} className={`${INPUT_CLASS} mb-3`} />
            {available.length === 0 ? (
              <p className="text-sm text-muted">{labels.availableEmpty}</p>
            ) : (
              <ul className="max-h-96 space-y-2 overflow-y-auto">
                {available.map((question) => (
                  <li key={question.id} className="flex items-start gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2">{question.statement}</span>
                      <span className="mt-0.5 block text-xs text-muted">{[question.typeLabel, labels.difficulties[String(question.difficulty)], question.categoryLabel].filter(Boolean).join(" · ")}</span>
                    </span>
                    <button type="button" onClick={() => setSelectedIds((current) => [...current, question.id])} className={buttonClass("secondary", "shrink-0", "sm")}>
                      + {labels.add}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <fieldset key={index} className="rounded-lg border border-line p-4">
              <legend className="px-1 text-sm font-semibold">{labels.rule.replace("{number}", String(index + 1))}</legend>
              <div className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_6rem_auto]">
                <label className="text-sm">
                  <span className="mb-1.5 block font-medium">{labels.ruleCategory}</span>
                  <select value={rule.categoryId} onChange={(event) => updateRule(index, { categoryId: event.target.value })} className={INPUT_CLASS}>
                    <option value="">{labels.allCategories}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block font-medium">{labels.ruleDifficulty}</span>
                  <select value={rule.difficulty} onChange={(event) => updateRule(index, { difficulty: event.target.value })} className={INPUT_CLASS}>
                    <option value="">{labels.anyDifficulty}</option>
                    {["1", "2", "3"].map((value) => (
                      <option key={value} value={value}>
                        {labels.difficulties[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block font-medium">{labels.ruleCount}</span>
                  <input type="number" min={1} max={100} value={rule.count} onChange={(event) => updateRule(index, { count: Number(event.target.value) })} className={INPUT_CLASS} />
                </label>
                <button type="button" disabled={rules.length <= 1} onClick={() => setRules((current) => current.filter((_, position) => position !== index))} className={buttonClass("ghost")}>
                  {labels.remove}
                </button>
              </div>
              <p className={`mt-2 text-sm ${matching(rule) < rule.count ? "font-semibold text-warning-text" : "text-muted"}`}>{labels.ruleAvailable.replace("{count}", String(matching(rule)))}</p>
            </fieldset>
          ))}
          <button type="button" onClick={() => setRules((current) => [...current, { categoryId: "", difficulty: "", count: 5 }])} className={buttonClass("secondary", "", "sm")}>
            + {labels.addRule}
          </button>
        </div>
      )}
    </div>
  );
}
