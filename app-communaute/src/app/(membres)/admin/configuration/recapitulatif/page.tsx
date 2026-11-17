/** CONFIGURATION › étape « recapitulatif » */
import Link from "next/link";
import { finishSetupAction } from "@/core/actions/setup";
import { startPreviewAction } from "@/core/actions/session";
import { displayName } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { defaultVocabulary, homeBlocksFor } from "@/core/modules/registry";
import { getActiveModules, getCommunity, getT } from "@/core/request/context";
import { buttonClass, Card } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.recapitulatif");

async function RecapitulatifStep() {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  const categoryCount = await db().category.count();
  const renamed = Object.entries(defaultVocabulary(active)).flatMap(([key, fallback]) => (community.vocabulary[key] ? [`${fallback.singular} → ${community.vocabulary[key].singular}`] : []));
  const swatch = (color: string) => (
    <span key={color} className="mr-3 inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="inline-block size-4 rounded border border-line" style={{ backgroundColor: color }} />
      <code className="text-xs">{color}</code>
    </span>
  );
  const rows = [
    { slug: "modules", label: t("core.config.summary.modules"), value: active.map((module) => t(module.nameKey)).join(", ") },
    { slug: "identite", label: t("core.config.summary.identity"), value: [displayName(community, t), community.subtitle].filter(Boolean).join(" — ") },
    { slug: "apparence", label: t("core.config.summary.theme"), value: <>{swatch(community.theme.colors.primary)}{swatch(community.theme.colors.accent)}{t(`core.font.${community.theme.font}`)}</> },
    { slug: "vocabulaire", label: t("core.config.summary.vocabulary"), value: renamed.length > 0 ? renamed.join(", ") : t("core.config.summary.vocabularyDefault") },
    { slug: "categories", label: t("core.config.summary.categories"), value: t("core.config.summary.categoriesCount", { count: categoryCount }) },
    { slug: "accueil", label: t("core.config.summary.home"), value: t("core.config.summary.blocks", { count: homeBlocksFor(active, community.home.blocks).length }) },
  ];

  return (
    <WizardFrame current="recapitulatif">
      <Card>
        <dl className="divide-y divide-line text-sm">
          {rows.map((row) => (
            <div key={row.slug} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-4">
              <dt className="font-medium text-muted">{row.label}</dt>
              <dd>{row.value}</dd>
              <dd>
                <Link href={`/admin/configuration/${row.slug}`} className="font-semibold text-primary-text hover:underline">
                  {t("core.config.summary.edit")}
                  <span className="sr-only"> : {row.label}</span>
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="mt-6 flex flex-wrap gap-3">
        <form action={startPreviewAction}>
          <button type="submit" className={buttonClass("secondary")}>
            <Icon name="eye" className="size-4" />
            {t("core.admin.settings.preview.action")}
          </button>
        </form>
        {community.setupStep !== null && (
          <form action={finishSetupAction}>
            <button type="submit" className={buttonClass("primary")}>
              {t("core.config.finish")}
            </button>
          </form>
        )}
      </div>
      {community.setupStep !== null && <p className="mt-4 text-sm text-muted">{t("core.config.finish.text")}</p>}
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", RecapitulatifStep);
