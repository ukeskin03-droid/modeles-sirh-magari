/**
 * /theme.css — la feuille de style du thème de la communauté (couleurs, police,
 * versions claire et sombre), calculée à partir de sa configuration.
 */
import crypto from "node:crypto";
import { connection } from "next/server";
import { loadCommunity } from "@/core/community/service";
import { buildTheme, themeToCss } from "@/core/theme/build";

export async function GET(request: Request): Promise<Response> {
  await connection(); // toujours calculée à la visite, jamais figée à la construction
  const community = await loadCommunity();
  const css = themeToCss(buildTheme(community.theme.colors, community.theme.font));

  // « ETag » : empreinte du contenu. Le navigateur revérifie à chaque page, mais ne
  // retélécharge la feuille que si le thème a changé.
  const etag = `"${crypto.createHash("sha1").update(css).digest("hex")}"`;
  const headers = { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-cache", ETag: etag };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(css, { headers });
}
