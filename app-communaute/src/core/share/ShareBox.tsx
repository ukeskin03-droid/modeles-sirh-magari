import { createShareLinkAction } from "@/core/actions/share";
import { getT } from "@/core/request/context";
import { ShareButton } from "@/core/ui/ShareButton";

/** À placer sur la page d'un contenu : le bouton « Partager », avec ses libellés. */
export async function ShareBox({ contentType, contentId }: { contentType: string; contentId: string }) {
  const t = await getT();
  return (
    <ShareButton
      createLink={createShareLinkAction.bind(null, contentType, contentId)}
      labels={{ button: t("core.share.button"), label: t("core.share.label"), copy: t("core.share.copy"), copied: t("core.share.copied"), help: t("core.share.help") }}
    />
  );
}
