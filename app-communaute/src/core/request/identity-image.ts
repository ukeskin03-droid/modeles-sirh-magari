/**
 * Sert le logo ou le favicon de la communauté. Si aucune image n'a été fournie, on
 * dessine une pastille à la couleur principale, avec l'initiale du nom.
 */
import { connection } from "next/server";
import { loadCommunity } from "@/core/community/service";
import { loadTranslator, displayName } from "@/core/community/translator";
import { readMedia } from "@/core/media/service";
import { buildTheme } from "@/core/theme/build";

/** En-têtes de sécurité : une image SVG ne doit jamais pouvoir exécuter de script. */
export function imageHeaders(mimeType: string, cacheControl: string): HeadersInit {
  return {
    "Content-Type": mimeType,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };
}

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);

export async function identityImageResponse(kind: "logo" | "favicon"): Promise<Response> {
  await connection();
  const community = await loadCommunity();
  const mediaId = kind === "logo" ? community.logoMediaId : (community.faviconMediaId ?? community.logoMediaId);
  const media = mediaId ? await readMedia(mediaId) : null;
  if (media) {
    return new Response(new Uint8Array(media.data), { headers: imageHeaders(media.mimeType, "public, max-age=300") });
  }

  const name = displayName(community, await loadTranslator());
  const theme = buildTheme(community.theme.colors, community.theme.font).light;
  const initial = escapeXml(name.trim().charAt(0).toUpperCase() || "•");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${theme.primary}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="${theme["on-primary"]}">${initial}</text></svg>`;
  return new Response(svg, { headers: imageHeaders("image/svg+xml", "no-cache") });
}
