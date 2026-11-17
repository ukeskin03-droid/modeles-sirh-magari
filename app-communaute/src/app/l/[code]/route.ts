/**
 * /l/<code> — lien court de partage. Note le clic dans le journal d'activité, puis
 * renvoie vers le contenu. Un visiteur non connecté arrive sur la page de connexion, qui
 * porte l'aperçu du contenu (ce que les messageries affichent quand on colle le lien).
 */
import { redirect } from "next/navigation";
import { recordActivity } from "@/core/activity/log";
import { getViewer } from "@/core/request/context";
import { resolveShareCode } from "@/core/share/service";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }): Promise<Response> {
  const { code } = await params;
  const target = await resolveShareCode(code);
  if (!target) redirect("/");
  const viewer = await getViewer();
  await recordActivity({ type: "share.click", userId: viewer?.id, contentType: target.contentType, contentId: target.contentId, meta: { channel: target.channel, connected: Boolean(viewer) } });
  redirect(viewer ? target.url : `/connexion?suite=${encodeURIComponent(target.url)}`);
}
