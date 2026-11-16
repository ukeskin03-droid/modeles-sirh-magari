/**
 * CHAMPS LIÉS — le point de branchement entre modules.
 *
 * Un module hôte (ex. le quiz) ne sait pas quels autres modules existent. Dans son
 * formulaire, il place simplement <LinkedFieldsEditor hostType="quiz.question" … /> ;
 * dans sa page lecteur, <LinkedContent … />. Ces composants demandent au registre
 * « quels champs les modules ACTIFS proposent-ils pour ce type de contenu ? ».
 * S'il n'y en a aucun, ils n'affichent rien du tout.
 */
import Link from "next/link";
import { findContentType, linkedFieldsFor } from "@/core/modules/registry";
import { getActiveModules, getT } from "@/core/request/context";
import { SelectField } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";
import { linkedIds, setLinks } from "./links";

const fieldName = (fieldId: string) => `lien:${fieldId}`;

/** Dans un formulaire d'administration : une liste de choix par champ lié proposé. */
export async function LinkedFieldsEditor({ hostType, hostId }: { hostType: string; hostId: string | null }) {
  const [active, t] = await Promise.all([getActiveModules(), getT()]);
  const fields = linkedFieldsFor(active, hostType);
  if (fields.length === 0) return null;

  const editors = await Promise.all(
    fields.map(async (field) => {
      const target = findContentType(field.targetType, active);
      const choices = target ? await target.list() : [];
      const current = hostId ? await linkedIds({ type: hostType, id: hostId }, field.id) : [];
      return { field, choices, current: current[0] ?? "" };
    }),
  );

  return (
    <>
      {editors.map(({ field, choices, current }) => (
        <SelectField
          key={field.id}
          label={t(field.labelKey)}
          name={fieldName(field.id)}
          defaultValue={current}
          options={[{ value: "", label: t("core.linked.none") }, ...choices.map((choice) => ({ value: choice.id, label: choice.title }))]}
        />
      ))}
    </>
  );
}

/** À l'enregistrement du formulaire hôte : enregistre les champs liés qu'il contenait. */
export async function saveLinkedFields(hostType: string, hostId: string, data: FormData): Promise<void> {
  const active = await getActiveModules();
  for (const field of linkedFieldsFor(active, hostType)) {
    // Champ absent du formulaire : on ne touche à rien.
    if (!data.has(fieldName(field.id))) continue;
    const value = String(data.get(fieldName(field.id)) ?? "");
    await setLinks({ type: hostType, id: hostId }, field.id, field.targetType, value ? [value] : []);
  }
}

/** Côté lecteur : les contenus liés, visibles, sous forme de liens. */
export async function LinkedContent({ hostType, hostId }: { hostType: string; hostId: string }) {
  const [active, t] = await Promise.all([getActiveModules(), getT()]);
  const fields = linkedFieldsFor(active, hostType);
  if (fields.length === 0) return null;

  const links = (
    await Promise.all(
      fields.map(async (field) => {
        const target = findContentType(field.targetType, active);
        if (!target) return [];
        const ids = await linkedIds({ type: hostType, id: hostId }, field.id);
        const summaries = await Promise.all(ids.map((id) => target.summarize(id)));
        return summaries.flatMap((summary) => (summary && summary.visible && summary.url ? [{ field, summary, url: summary.url }] : []));
      }),
    )
  ).flat();
  if (links.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1 text-sm">
      {links.map(({ field, summary, url }) => (
        <li key={`${field.id}:${summary.id}`}>
          <span className="text-muted">{t(field.readerLabelKey)} </span>
          <Link href={url} className="inline-flex items-center gap-1 font-semibold text-primary-text hover:underline">
            {summary.title}
            <Icon name="arrow" className="size-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
