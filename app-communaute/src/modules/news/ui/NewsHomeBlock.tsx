import Link from "next/link";
import { formatDate } from "@/core/i18n/format";
import { getT, requireViewer } from "@/core/request/context";
import { HomeBlockCard } from "@/core/ui/blocks";
import { Badge } from "@/core/ui/elements";
import { listVisibleNews } from "../service";

/** Bloc du module sur la page d'accueil : les trois dernières actualités. */
export async function NewsHomeBlock() {
  const [t, viewer] = await Promise.all([getT(), requireViewer()]);
  const items = await listVisibleNews(viewer.id, { limit: 3 });
  return (
    <HomeBlockCard icon="news" title={t("news.block.title")} text={items.length === 0 ? t("news.block.text") : undefined} href="/actualites" linkLabel={t("news.block.all")}>
      {items.length > 0 && (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/actualites/${item.slug}`} className="font-medium hover:text-primary-text hover:underline">
                {item.title}
              </Link>{" "}
              {item.isNew && <Badge tone="info">{t("news.badge.new")}</Badge>}
              {item.publishAt && <span className="block text-xs text-muted">{formatDate(item.publishAt)}</span>}
            </li>
          ))}
        </ul>
      )}
    </HomeBlockCard>
  );
}
