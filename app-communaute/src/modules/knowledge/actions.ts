"use server";

/**
 * BASE DE CONNAISSANCE — actions déclenchées par les formulaires d'administration.
 */
import { redirect } from "next/navigation";
import { parseTagList } from "@/core/content/tags";
import { getT, requireModuleCan } from "@/core/request/context";
import type { FormState } from "@/core/ui/forms";
import { checkArticle, type ArticleInput } from "./model";
import { deleteArticle, saveArticle } from "./service";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function saveArticleAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireModuleCan("knowledge", "knowledge.manage");
  const t = await getT();
  const input: ArticleInput = {
    title: text(data, "title"),
    summary: text(data, "summary"),
    content: text(data, "content"),
    categoryId: text(data, "categoryId") || null,
    status: text(data, "status") === "published" ? "published" : "draft",
    tags: parseTagList(text(data, "tags")),
    relatedIds: data.getAll("related").map(String),
  };
  const issues = checkArticle(input);
  if (issues.length > 0) return { error: issues.map((issue) => t(issue.key, issue.params)).join(" ") };

  await saveArticle(text(data, "id") || null, input, { authorId: viewer.id });
  redirect("/admin/articles");
}

export async function deleteArticleAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireModuleCan("knowledge", "knowledge.manage");
  await deleteArticle(text(data, "id"));
  redirect("/admin/articles");
}
