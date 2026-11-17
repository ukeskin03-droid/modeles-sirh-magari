"use server";

/** ACTION DE PARTAGE — fabrique le lien court d'un contenu. */
import { activeModules, findContentType } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";
import { getBaseUrl, requireViewer } from "@/core/request/context";
import { shareCodeFor } from "@/core/share/service";

export async function createShareLinkAction(contentType: string, contentId: string): Promise<{ url: string } | null> {
  await requireViewer();
  // On ne crée un lien que vers un contenu existant, visible, d'un module actif.
  const summary = await findContentType(contentType, activeModules(await readModuleStates()))?.summarize(contentId);
  if (!summary?.visible || !summary.url) return null;
  return { url: `${await getBaseUrl()}/l/${await shareCodeFor(contentType, contentId)}` };
}
