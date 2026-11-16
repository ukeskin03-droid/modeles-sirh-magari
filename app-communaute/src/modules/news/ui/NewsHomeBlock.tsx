import { getT } from "@/core/request/context";
import { HomeBlockCard } from "@/core/ui/blocks";

/** Bloc du module sur la page d'accueil. */
export async function NewsHomeBlock() {
  const t = await getT();
  return (
    <HomeBlockCard
      icon="news"
      title={t("news.block.title")}
      text={t("news.block.text")}
      href="/actualites"
      linkLabel={t("core.block.open")}
    />
  );
}
