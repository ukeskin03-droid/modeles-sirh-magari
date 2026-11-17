/**
 * ADMINISTRATION › IMPORT EN MASSE
 *
 * La page liste les formats d'import proposés par les modules ACTIFS, pour lesquels la
 * personne a le droit d'agir. Chaque format a ses modèles de fichiers à télécharger.
 */
import { bulkImportAction } from "@/core/actions/import";
import { importFormatsFor } from "@/core/modules/registry";
import { getActiveModules, getT, viewerCan } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { buttonClass, Card, EmptyState, PageContainer, PageHeader, SectionTitle } from "@/core/ui/elements";
import { flowLabels } from "@/core/ui/flow-labels";
import { Icon } from "@/core/ui/icons";
import { UploadPreviewFlow } from "@/core/ui/UploadPreviewFlow";

export const generateMetadata = titleFrom("core.admin.import.title");

async function ImportPage() {
  const [t, active] = await Promise.all([getT(), getActiveModules()]);
  const formats = [];
  for (const format of importFormatsFor(active)) if (await viewerCan(format.action)) formats.push(format);

  return (
    <PageContainer>
      <PageHeader title={t("core.admin.import.title")} description={t("core.admin.import.intro")} back={{ href: "/admin", label: t("core.admin.back") }} />
      {formats.length === 0 ? (
        <EmptyState icon="upload" title={t("core.admin.import.empty")} />
      ) : (
        <div className="space-y-6">
          {formats.map((format) => (
            <Card key={format.id}>
              <SectionTitle>{t(format.labelKey)}</SectionTitle>
              <p className="mt-2 text-sm text-muted">{t(format.descriptionKey)}</p>
              <div className="my-4">
                <p className="mb-2 text-sm font-medium">{t("core.admin.import.templates")}</p>
                <ul className="flex flex-wrap gap-2">
                  {format.templates.map((template) => (
                    <li key={template.filename}>
                      <a href={`/admin/import/modele/${format.id}/${template.filename}`} download className={buttonClass("secondary", "", "sm")}>
                        <Icon name="download" className="size-4" />
                        {t(template.labelKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {/* bind : l'action sait de quel format il s'agit */}
              <UploadPreviewFlow action={bulkImportAction.bind(null, format.id)} accept={format.accept} multiple={format.multiple} labels={flowLabels(t, { multiple: format.multiple })} />
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default adminPage("core.media.manage", ImportPage);
