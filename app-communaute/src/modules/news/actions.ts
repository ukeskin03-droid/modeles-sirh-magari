"use server";

/**
 * ACTUALITÉS — actions déclenchées par les formulaires d'administration.
 */
import { redirect } from "next/navigation";
import { saveLinkedFields } from "@/core/content/linked-fields";
import { fromDateTimeInput } from "@/core/i18n/format";
import { getT, requireModuleCan } from "@/core/request/context";
import type { FormState } from "@/core/ui/forms";
import { checkNews, NEWS_STATUSES, type NewsInput } from "./model";
import { deleteNews, saveNews } from "./service";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function saveNewsAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireModuleCan("news", "news.manage");
  const t = await getT();
  const input: NewsInput = {
    title: text(data, "title"),
    summary: text(data, "summary"),
    content: text(data, "content"),
    categoryId: text(data, "categoryId") || null,
    status: NEWS_STATUSES.find((status) => status === text(data, "status")) ?? "draft",
    publishAt: fromDateTimeInput(text(data, "publishAt")),
    expiresAt: fromDateTimeInput(text(data, "expiresAt")),
    pinned: data.get("pinned") === "on",
  };
  const issues = checkNews(input);
  if (issues.length > 0) return { error: issues.map((issue) => t(issue.key, issue.params)).join(" ") };

  const id = await saveNews(text(data, "id") || null, input, { authorId: viewer.id });
  await saveLinkedFields("news.item", id, data);
  redirect("/admin/actualites");
}

export async function deleteNewsAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireModuleCan("news", "news.manage");
  await deleteNews(text(data, "id"));
  redirect("/admin/actualites");
}
