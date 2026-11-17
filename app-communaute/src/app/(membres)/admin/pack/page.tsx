/**
 * ADMINISTRATION › EXPORT ET IMPORT — sauvegarder la communauté dans un pack .zip, ou en
 * importer un (avec un résumé des changements avant toute modification).
 */
import { packImportAction } from "@/core/actions/library";
import { getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { buttonClass, Card, PageContainer, PageHeader, SectionTitle } from "@/core/ui/elements";
import { flowLabels } from "@/core/ui/flow-labels";
import { Icon } from "@/core/ui/icons";
import { UploadPreviewFlow } from "@/core/ui/UploadPreviewFlow";

export const generateMetadata = titleFrom("core.admin.pack.title");

async function PackPage() {
  const t = await getT();
  const exports = [
    { href: "/admin/pack/export", title: t("core.admin.pack.export.config"), help: t("core.admin.pack.export.configHelp") },
    { href: "/admin/pack/export?contenus=1", title: t("core.admin.pack.export.full"), help: t("core.admin.pack.export.fullHelp") },
  ];

  return (
    <PageContainer narrow>
      <PageHeader title={t("core.admin.pack.title")} description={t("core.admin.pack.description")} back={{ href: "/admin", label: t("core.admin.back") }} />
      <div className="space-y-6">
        <Card>
          <SectionTitle>{t("core.admin.pack.export.title")}</SectionTitle>
          <p className="mt-2 text-sm text-muted">{t("core.admin.pack.export.text")}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {exports.map((item) => (
              <li key={item.href} className="flex flex-col rounded-lg border border-line p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mb-4 mt-1 text-sm text-muted">{item.help}</p>
                {/* Lien simple (et non lien Next.js) : il déclenche un téléchargement. */}
                <a href={item.href} download className={buttonClass("secondary", "mt-auto")}>
                  <Icon name="download" className="size-4" />
                  {t("core.admin.pack.export.title")}
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>{t("core.admin.pack.import.title")}</SectionTitle>
          <p className="mb-4 mt-2 text-sm text-muted">{t("core.admin.pack.import.text")}</p>
          <UploadPreviewFlow action={packImportAction} accept=".zip,application/zip" labels={flowLabels(t)} />
        </Card>
      </div>
    </PageContainer>
  );
}

export default adminPage("core.community.configure", PackPage);
