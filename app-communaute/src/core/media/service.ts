/**
 * MÉDIATHÈQUE
 *
 * Chaque fichier a une fiche en base (nom d'origine, type, taille, texte alternatif) et un
 * contenu dans le stockage. Il est servi à l'adresse /media/<clé>, où la clé est son nom
 * dans le stockage. Cette clé est conservée dans les packs : une image insérée dans un
 * contenu reste donc valable après un export puis un import dans une autre installation.
 */
import crypto from "node:crypto";
import path from "node:path";
import { db, isDryRun } from "@/core/db/client";
import { mediaStorage } from "./storage";

/** Types de fichiers acceptés, avec leur extension. */
export const ALLOWED_MEDIA_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export class MediaError extends Error {
  constructor(public readonly reason: "unsupported-type" | "too-large") {
    super(reason);
  }
}

/** Adresse publique d'un média. */
export function mediaUrl(media: { storageKey: string }): string {
  return `/media/${media.storageKey}`;
}

const SAFE_KEY = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}$/;

/**
 * Enregistre un fichier. Renvoie sa fiche et ce qui s'est passé.
 * Avec « key » (import d'un pack), le fichier garde cette clé : s'il existe déjà, il est
 * mis à jour seulement si son contenu a changé.
 */
export async function saveMedia(input: { filename: string; data: Buffer; alt?: string; isPublic?: boolean; key?: string }): Promise<{ id: string; storageKey: string; outcome: "created" | "updated" | "unchanged" }> {
  const extension = path.extname(input.key ?? input.filename).toLowerCase();
  const mimeType = ALLOWED_MEDIA_TYPES[extension];
  if (!mimeType) throw new MediaError("unsupported-type");
  if (input.data.byteLength > MEDIA_MAX_BYTES) throw new MediaError("too-large");

  const storage = mediaStorage();
  if (input.key && SAFE_KEY.test(input.key)) {
    const existing = await db().media.findUnique({ where: { storageKey: input.key } });
    if (existing) {
      const current = await storage.get(existing.storageKey);
      const sameContent = current !== null && Buffer.compare(current, input.data) === 0;
      const sameInfo = existing.alt === (input.alt ?? existing.alt) && existing.isPublic === (input.isPublic ?? existing.isPublic);
      if (sameContent && sameInfo) return { id: existing.id, storageKey: existing.storageKey, outcome: "unchanged" };
      // Pendant une simulation d'import, aucun fichier n'est réellement écrit ni supprimé.
      if (!sameContent && !isDryRun()) await storage.put(existing.storageKey, input.data);
      await db().media.update({ where: { id: existing.id }, data: { size: input.data.byteLength, alt: input.alt ?? existing.alt, isPublic: input.isPublic ?? existing.isPublic } });
      return { id: existing.id, storageKey: existing.storageKey, outcome: "updated" };
    }
  }

  const storageKey = input.key && SAFE_KEY.test(input.key) ? input.key : `${crypto.randomUUID()}${extension}`;
  if (!isDryRun()) await storage.put(storageKey, input.data);
  const media = await db().media.create({
    data: { filename: path.basename(input.filename), mimeType, size: input.data.byteLength, alt: input.alt ?? "", storageKey, isPublic: input.isPublic ?? false },
  });
  return { id: media.id, storageKey, outcome: "created" };
}

type MediaContent = { mimeType: string; isPublic: boolean; data: Buffer };

async function withData(media: { mimeType: string; isPublic: boolean; storageKey: string } | null): Promise<MediaContent | null> {
  if (!media) return null;
  const data = await mediaStorage().get(media.storageKey);
  return data ? { mimeType: media.mimeType, isPublic: media.isPublic, data } : null;
}

export async function readMedia(id: string): Promise<MediaContent | null> {
  return withData(await db().media.findUnique({ where: { id } }));
}

export async function readMediaByKey(storageKey: string): Promise<MediaContent | null> {
  return withData(await db().media.findUnique({ where: { storageKey } }));
}

export async function listMedia() {
  return db().media.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  await db().media.updateMany({ where: { id }, data: { alt: alt.trim().slice(0, 300) } });
}

export async function deleteMedia(id: string): Promise<void> {
  const media = await db().media.findUnique({ where: { id } });
  if (!media) return;
  if (!isDryRun()) await mediaStorage().delete(media.storageKey);
  await db().media.delete({ where: { id } });
}
