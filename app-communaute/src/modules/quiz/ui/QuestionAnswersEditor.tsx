"use client";

/**
 * Partie interactive du formulaire de question : le type, et les réponses proposées
 * (qui s'adaptent au type). S'exécute dans le navigateur.
 *
 * Les réponses sont transmises au serveur par un champ caché « options », au format
 * [{ "label": "…", "isCorrect": true }, …].
 */
import { useState } from "react";
import { buttonClass, INPUT_CLASS } from "@/core/ui/elements";
import { FALSE_CODE, MAX_OPTIONS, MIN_OPTIONS, QUESTION_TYPES, TRUE_CODE, type QuestionType } from "../model";

type Option = { label: string; isCorrect: boolean };

export type AnswersEditorLabels = {
  type: string;
  types: Record<QuestionType, string>;
  options: string;
  hintSingle: string;
  hintMultiple: string;
  /** Contiennent « {number} » */
  optionLabel: string;
  removeOption: string;
  optionCorrect: string;
  addOption: string;
  trueFalse: string;
  optionTrue: string;
  optionFalse: string;
};

const blank = (): Option[] => [
  { label: "", isCorrect: true },
  { label: "", isCorrect: false },
];

export function QuestionAnswersEditor({ initialType, initialOptions, labels }: { initialType: QuestionType; initialOptions: Option[]; labels: AnswersEditorLabels }) {
  const [type, setType] = useState<QuestionType>(initialType);
  // On garde les réponses « à choix » même si l'on passe un instant par vrai/faux.
  const [choices, setChoices] = useState<Option[]>(initialType === "truefalse" || initialOptions.length === 0 ? blank() : initialOptions);
  const [answerIsTrue, setAnswerIsTrue] = useState(initialType === "truefalse" ? (initialOptions[0]?.isCorrect ?? true) : true);

  const options: Option[] =
    type === "truefalse"
      ? [
          { label: TRUE_CODE, isCorrect: answerIsTrue },
          { label: FALSE_CODE, isCorrect: !answerIsTrue },
        ]
      : choices;

  const update = (index: number, change: Partial<Option>) =>
    setChoices((current) =>
      current.map((option, position) => {
        if (position === index) return { ...option, ...change };
        // Choix unique : cocher une bonne réponse décoche les autres.
        return type === "single" && change.isCorrect ? { ...option, isCorrect: false } : option;
      }),
    );

  const changeType = (next: QuestionType) => {
    setType(next);
    if (next === "single") {
      // On ne garde qu'une seule bonne réponse (la première cochée).
      setChoices((current) => {
        const first = Math.max(0, current.findIndex((option) => option.isCorrect));
        return current.map((option, index) => ({ ...option, isCorrect: index === first }));
      });
    }
  };

  const number = (template: string, index: number) => template.replace("{number}", String(index + 1));

  return (
    <div className="space-y-4">
      <input type="hidden" name="options" value={JSON.stringify(options)} />
      <div>
        <label htmlFor="champ-type" className="mb-1.5 block text-sm font-medium">
          {labels.type}
        </label>
        <select id="champ-type" name="type" value={type} onChange={(event) => changeType(event.target.value as QuestionType)} className={INPUT_CLASS}>
          {QUESTION_TYPES.map((value) => (
            <option key={value} value={value}>
              {labels.types[value]}
            </option>
          ))}
        </select>
      </div>

      {type === "truefalse" ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{labels.trueFalse}</legend>
          <div className="flex flex-wrap gap-3">
            {[true, false].map((value) => (
              <label key={String(value)} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-4 has-checked:border-primary-text has-checked:bg-primary-soft">
                <input type="radio" name="reponse-vrai-faux" checked={answerIsTrue === value} onChange={() => setAnswerIsTrue(value)} className="size-4 accent-(--c-primary)" />
                {value ? labels.optionTrue : labels.optionFalse}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="text-sm font-medium">{labels.options}</legend>
          <p className="mb-3 mt-1 text-sm text-muted">{type === "single" ? labels.hintSingle : labels.hintMultiple}</p>
          <ul className="space-y-2">
            {choices.map((option, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  aria-label={number(labels.optionLabel, index)}
                  placeholder={number(labels.optionLabel, index)}
                  maxLength={500}
                  className={`${INPUT_CLASS} min-w-0 flex-1 basis-56`}
                />
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type={type === "single" ? "radio" : "checkbox"}
                    name="bonne-reponse"
                    checked={option.isCorrect}
                    onChange={(event) => update(index, { isCorrect: type === "single" ? true : event.target.checked })}
                    className="size-4 accent-(--c-primary)"
                  />
                  {labels.optionCorrect}
                </label>
                <button
                  type="button"
                  disabled={choices.length <= MIN_OPTIONS}
                  onClick={() => setChoices((current) => current.filter((_, position) => position !== index))}
                  aria-label={number(labels.removeOption, index)}
                  title={number(labels.removeOption, index)}
                  className={buttonClass("ghost", "", "sm")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={choices.length >= MAX_OPTIONS}
            onClick={() => setChoices((current) => [...current, { label: "", isCorrect: false }])}
            className={buttonClass("secondary", "mt-3", "sm")}
          >
            + {labels.addOption}
          </button>
        </fieldset>
      )}
    </div>
  );
}
