/**
 * ADMINISTRATION › MÉDIATHÈQUE — téléverser et réutiliser les images de la communauté.
 */
import { deleteMediaAction, updateMediaAltAction, uploadMediaAction } from "@/core/actions/library";
import { ALLOWED_MEDIA_TYPES, listMedia, mediaUrl } from "@/core/media/service";
import { getCommunity, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { Badge, Card, EmptyState, INPUT_CLASS, PageContainer, PageHeader, SectionTitle } from "@/core/ui/elements";
import { CopyButton } from "@/core/ui/CopyButton";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

export const generateMetadata = titleFrom("core.admin.media.title");

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`);

async function MediaLibraryPage() {
  const [t, community, medias] = await Promise.all([getT(), getCommunity(), listMedia()]);
  const identityIds = new Set([community.logoMediaId, community.faviconMediaId]);

  return (
    <PageContainer>
      <PageHeader title={t("core.admin.media.title")} description={t("core.admin.media.intro")} back={{ href: "/admin", label: t("core.admin.back") }} />

      <Card className="mb-8">
        <SectionTitle>{t("core.admin.media.upload")}</SectionTitle>
        <ActionForm action={uploadMediaAction} className="mt-4">
          <label htmlFor="champ-images" className="mb-1.5 block text-sm font-medium">
            {t("core.admin.media.files")}
          </label>
          <input id="champ-images" type="file" name="files" multiple required accept={Object.keys(ALLOWED_MEDIA_TYPES).join(",")} className={`${INPUT_CLASS} file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1`} />
          <div className="mt-4">
            <SubmitButton>{t("core.admin.media.submit")}</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      {medias.length === 0 ? (
        <EmptyState icon="image" title={t("core.admin.media.empty")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medias.map((media) => {
            const url = mediaUrl(media);
            const isIdentity = identityIds.has(media.id);
            return (
              <li key={media.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-xs">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- image de la médiathèque, de taille libre */}
                  <img src={url} alt={media.alt} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
                <p className="mt-3 truncate text-sm font-semibold" title={media.filename}>
                  {media.filename}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  {formatSize(media.size)}
                  {isIdentity && <Badge tone="info">{t("core.admin.media.identity")}</Badge>}
                </p>
                <ActionForm action={updateMediaAltAction} className="mt-3">
                  <input type="hidden" name="id" value={media.id} />
                  <label htmlFor={`alt-${media.id}`} className="mb-1 block text-xs font-medium">
                    {t("core.admin.media.alt")}
                  </label>
                  <div className="flex gap-2">
                    <input id={`alt-${media.id}`} name="alt" defaultValue={media.alt} maxLength={300} className={`${INPUT_CLASS} min-w-0 flex-1`} />
                    <SubmitButton variant="secondary" size="sm">
                      {t("core.admin.media.saveAlt")}
                    </SubmitButton>
                  </div>
                </ActionForm>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* Texte Markdown prêt à coller dans un contenu */}
                  <CopyButton value={`![${media.alt}](${url})`} label={t("core.admin.media.copy")} copiedLabel={t("core.admin.media.copied")} />
                  {!isIdentity && (
                    <ActionForm
                      action={deleteMediaAction}
                      confirmation={{ title: t("core.admin.media.delete.title"), text: t("core.admin.media.delete.text"), confirm: t("core.form.delete"), cancel: t("core.confirm.cancel"), danger: true }}
                    >
                      <input type="hidden" name="id" value={media.id} />
                      <SubmitButton variant="ghost" size="sm">
                        {t("core.form.delete")}
                        <span className="sr-only"> : {media.filename}</span>
                      </SubmitButton>
                    </ActionForm>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}

export default adminPage("core.media.manage", MediaLibraryPage);
