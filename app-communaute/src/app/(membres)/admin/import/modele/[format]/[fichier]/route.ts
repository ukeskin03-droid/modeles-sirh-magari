/**
 * /admin/import/modele/<format>/<fichier> — télécharge un modèle de fichier d'import.
 * Le modèle est fabriqué à la demande : ses colonnes dépendent des modules actifs.
 */
import { importFormatsFor } from "@/core/modules/registry";
import { getActiveModules, getT, requireViewer, viewerCan } from "@/core/request/context";

export async function GET(_request: Request, { params }: { params: Promise<{ format: string; fichier: string }> }): Promise<Response> {
  await requireViewer();
  const [{ format: formatId, fichier }, active, t] = await Promise.all([params, getActiveModules(), getT()]);
  const format = importFormatsFor(active).find((candidate) => candidate.id === formatId);
  const template = format?.templates.find((candidate) => candidate.filename === fichier);
  if (!format || !template || !(await viewerCan(format.action))) return new Response(null, { status: 404 });
  return new Response(template.build({ t, active }), {
    headers: { "Content-Type": template.contentType, "Content-Disposition": `attachment; filename="${template.filename}"`, "Cache-Control": "no-store" },
  });
}
