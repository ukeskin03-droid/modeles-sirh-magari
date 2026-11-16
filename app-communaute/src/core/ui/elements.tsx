/**
 * ÉLÉMENTS D'INTERFACE DE BASE
 *
 * Boutons, cartes, encadrés, champs de formulaire… Tous les écrans les utilisent, ce
 * qui garantit une apparence cohérente et accessible. Les couleurs viennent du thème
 * de la communauté (classes « bg-primary », « text-muted », etc. — voir globals.css).
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";

// ── Boutons ──────────────────────────────────────────────────────────────────
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonSize = "md" | "sm";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

// « sm » : bouton compact pour les tableaux et les bandeaux (reste assez grand pour le doigt).
const BUTTON_SIZES: Record<ButtonSize, string> = { md: "min-h-10 px-4 py-2", sm: "min-h-9 px-2.5 py-1" };

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:brightness-110",
  secondary: "border border-line bg-surface text-fg hover:bg-surface-2",
  danger: "border border-danger-text/40 bg-surface text-danger-text hover:bg-danger-soft",
  ghost: "text-fg hover:bg-surface-2",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = "", size: ButtonSize = "md"): string {
  return `${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button {...props} className={buttonClass(variant, className, size)} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link {...props} className={buttonClass(variant, className, size)} />;
}

/** Les catégories sous forme d'options de liste déroulante, précédées d'un choix « vide ». */
export function categoryOptions(categories: readonly { id: string; label: string }[], emptyLabel: string) {
  return [{ value: "", label: emptyLabel }, ...categories.map((category) => ({ value: category.id, label: category.label }))];
}

// ── Structure de page ────────────────────────────────────────────────────────
export function PageContainer({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto w-full px-4 py-8 sm:py-10 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  back,
  children,
}: {
  title: string;
  description?: string;
  /** Lien de retour affiché au-dessus du titre */
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-text hover:underline">
          <Icon name="arrow" className="size-4 rotate-180" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-5 shadow-xs ${className}`}>{children}</div>;
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-lg font-semibold">
      {children}
    </h2>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────
export type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, { box: string; icon: IconName }> = {
  info: { box: "border-primary-text/30 bg-primary-soft text-fg", icon: "info" },
  success: { box: "border-success-text/30 bg-success-soft text-fg", icon: "check" },
  warning: { box: "border-warning-text/30 bg-warning-soft text-fg", icon: "alert" },
  danger: { box: "border-danger-text/30 bg-danger-soft text-fg", icon: "alert" },
};

/** Encadré d'information. « role » : "alert" pour une erreur, "status" pour une confirmation. */
export function Alert({ tone = "info", role, children }: { tone?: Tone; role?: "alert" | "status"; children: ReactNode }) {
  return (
    <div role={role} className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${TONES[tone].box}`}>
      <Icon name={TONES[tone].icon} className="mt-0.5 size-4" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const BADGE_TONES: Record<Tone | "neutral", string> = {
  neutral: "bg-surface-2 text-muted",
  info: "bg-primary-soft text-primary-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone | "neutral"; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}>{children}</span>;
}

export function EmptyState({ icon = "info", title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <Icon name={icon} className="mx-auto size-8 text-muted" />
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>}
    </div>
  );
}

// ── Formulaires ──────────────────────────────────────────────────────────────
export const INPUT_CLASS =
  "block min-h-10 w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-fg placeholder:text-muted sm:text-sm";

/** Champ de saisie avec son libellé et, si besoin, une aide. Le libellé est relié au champ. */
export function Field({ label, hint, name, ...props }: ComponentProps<"input"> & { label: string; hint?: string; name: string }) {
  const id = props.id ?? `champ-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input {...props} id={id} name={name} aria-describedby={hint ? `${id}-aide` : undefined} className={INPUT_CLASS} />
      {hint && (
        <p id={`${id}-aide`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  hideLabel = false,
  ...props
}: ComponentProps<"select"> & { label: string; name: string; options: { value: string; label: string }[]; hideLabel?: boolean }) {
  const id = props.id ?? `champ-${name}`;
  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium"}>
        {label}
      </label>
      <select {...props} id={id} name={name} className={INPUT_CLASS}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Tableaux ─────────────────────────────────────────────────────────────────
/** Tableau simple, qui défile horizontalement sur petit écran plutôt que de déborder. */
export function DataTable({ caption, headers, children }: { caption: string; headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-xl text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

/** Zone de texte sur plusieurs lignes, avec son libellé et, si besoin, une aide. */
export function TextAreaField({ label, hint, name, ...props }: ComponentProps<"textarea"> & { label: string; hint?: string; name: string }) {
  const id = props.id ?? `champ-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea {...props} id={id} name={name} aria-describedby={hint ? `${id}-aide` : undefined} className={`${INPUT_CLASS} min-h-24`} />
      {hint && (
        <p id={`${id}-aide`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
