import Link from "next/link";
import { formatDate } from "@/core/i18n/format";
import { getT } from "@/core/request/context";
import { HomeBlockCard } from "@/core/ui/blocks";
import { listPublishedArticles } from "../service";

/** Bloc du module sur la page d'accueil : les trois articles mis à jour le plus récemment. */
export async function KnowledgeHomeBlock() {
  const t = await getT();
  const articles = await listPublishedArticles({ limit: 3 });
  return (
    <HomeBlockCard icon="book" title={t("knowledge.block.title")} text={articles.length === 0 ? t("knowledge.block.text") : undefined} href="/articles" linkLabel={t("knowledge.block.all")}>
      {articles.length > 0 && (
        <ul className="space-y-2 text-sm">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/articles/${article.slug}`} className="font-medium hover:text-primary-text hover:underline">
                {article.title}
              </Link>
              <span className="block text-xs text-muted">{t("knowledge.detail.revised", { date: formatDate(article.revisedAt) })}</span>
            </li>
          ))}
        </ul>
      )}
    </HomeBlockCard>
  );
}
