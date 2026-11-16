/**
 * /media/<identifiant> — sert un fichier de la médiathèque.
 * Les images publiques (logo, favicon) sont visibles par tous ; les autres sont
 * réservées aux personnes connectées.
 */
import { readMedia } from "@/core/media/service";
import { getViewer } from "@/core/request/context";
import { imageHeaders } from "@/core/request/identity-image";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const viewer = await getViewer();
  const media = await readMedia(id);
  if (!media || (!media.isPublic && !viewer)) return new Response(null, { status: 404 });
  const cacheControl = media.isPublic ? "public, max-age=300" : "private, max-age=300";
  return new Response(new Uint8Array(media.data), { headers: imageHeaders(media.mimeType, cacheControl) });
}
