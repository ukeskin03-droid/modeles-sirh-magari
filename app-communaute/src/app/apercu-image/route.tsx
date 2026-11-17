/**
 * /apercu-image?chemin=/actualites/xxx — l'image d'aperçu d'un lien partagé (1200 × 630),
 * aux couleurs de la communauté. Elle ne montre le titre du contenu que si le réglage
 * « aperçu des liens partagés » le permet ; sinon, seulement le nom de la communauté.
 */
import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { safeInternalPath } from "@/core/auth/constants";
import { loadCommunity } from "@/core/community/service";
import { sharePreviewFor } from "@/core/share/service";
import { buildTheme } from "@/core/theme/build";

export async function GET(request: Request): Promise<Response> {
  await connection();
  const pathname = safeInternalPath(new URL(request.url).searchParams.get("chemin"), "/").split("?")[0];
  const [preview, community] = await Promise.all([sharePreviewFor(pathname), loadCommunity()]);
  const theme = buildTheme(community.theme.colors, community.theme.font).light;
  const title = preview.title.length > 110 ? `${preview.title.slice(0, 109)}…` : preview.title;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: theme.primary, color: theme["on-primary"] }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: theme["on-primary"], marginRight: 18 }} />
          {preview.communityName}
        </div>
        <div style={{ display: "flex", fontSize: preview.detailed ? 64 : 84, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>{preview.detailed ? "" : preview.description}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=300" } },
  );
}
