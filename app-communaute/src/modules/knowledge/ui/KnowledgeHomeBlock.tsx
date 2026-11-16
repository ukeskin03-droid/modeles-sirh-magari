import { getT } from "@/core/request/context";
import { HomeBlockCard } from "@/core/ui/blocks";

/** Bloc du module sur la page d'accueil. */
export async function KnowledgeHomeBlock() {
  const t = await getT();
  return (
    <HomeBlockCard
      icon="book"
      title={t("knowledge.block.title")}
      text={t("knowledge.block.text")}
      href="/articles"
      linkLabel={t("core.block.open")}
    />
  );
}
