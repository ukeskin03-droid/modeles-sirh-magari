/**
 * Éléments réutilisés par les modules : la carte d'un bloc d'accueil.
 */
import Link from "next/link";
import { Icon, type IconName } from "./icons";

export function HomeBlockCard({
  icon,
  title,
  text,
  href,
  linkLabel,
  children,
}: {
  icon: IconName;
  title: string;
  text?: string;
  href: string;
  linkLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
          <Icon name={icon} />
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {text && <p className="mt-3 text-sm text-muted">{text}</p>}
      {children && <div className="mt-3">{children}</div>}
      <div className="mt-auto pt-4">
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-text hover:underline">
          {linkLabel}
          <span className="sr-only"> : {title}</span>
          <Icon name="arrow" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
