/**
 * /admin/pack/export — télécharge le pack de la communauté (.zip).
 * Avec « ?contenus=1 » : configuration et contenus ; sinon : configuration seule.
 */
import { slugify } from "@/core/content/text";
import { loadCommunity } from "@/core/community/service";
import { exportPack } from "@/core/pack/export";
import { writeZip } from "@/core/pack/zip";
import { requireCan } from "@/core/request/context";

export async function GET(request: Request): Promise<Response> {
  await requireCan("core.community.configure");
  const includeContents = new URL(request.url).searchParams.get("contenus") === "1";
  const archive = writeZip(await exportPack({ includeContents }));
  const name = slugify((await loadCommunity()).name) || "communaute";
  const suffix = includeContents ? "complet" : "configuration";
  return new Response(Buffer.from(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}-${suffix}-${new Date().toISOString().slice(0, 10)}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
