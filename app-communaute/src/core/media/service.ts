/**
 * MÉDIATHÈQUE
 *
 * Chaque fichier a une fiche en base (nom, type, taille, texte alternatif) et un
 * contenu dans le stockage. En phase 2, la médiathèque ne contient que le logo et le
 * favicon ; l'écran de téléversement arrive avec l'atelier (phase 6).
 */
import crypto from "node:crypto";
import path from "node:path";
import { db } from "@/core/db/client";
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

export async function saveMedia(input: { filename: string; data: Buffer; alt?: string; isPublic?: boolean }): Promise<string> {
  const extension = path.extname(input.filename).toLowerCase();
  const mimeType = ALLOWED_MEDIA_TYPES[extension];
  if (!mimeType) throw new MediaError("unsupported-type");
  if (input.data.byteLength > MEDIA_MAX_BYTES) throw new MediaError("too-large");

  const storageKey = `${crypto.randomUUID()}${extension}`;
  await mediaStorage().put(storageKey, input.data);
  const media = await db().media.create({
    data: {
      filename: path.basename(input.filename),
      mimeType,
      size: input.data.byteLength,
      alt: input.alt ?? "",
      storageKey,
      isPublic: input.isPublic ?? false,
    },
  });
  return media.id;
}

export async function readMedia(id: string): Promise<{ mimeType: string; isPublic: boolean; data: Buffer } | null> {
  const media = await db().media.findUnique({ where: { id } });
  if (!media) return null;
  const data = await mediaStorage().get(media.storageKey);
  return data ? { mimeType: media.mimeType, isPublic: media.isPublic, data } : null;
}

export async function deleteMedia(id: string): Promise<void> {
  const media = await db().media.findUnique({ where: { id } });
  if (!media) return;
  await mediaStorage().delete(media.storageKey);
  await db().media.delete({ where: { id } });
}
