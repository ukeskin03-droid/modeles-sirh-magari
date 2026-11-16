import { getT } from "@/core/request/context";
import { HomeBlockCard } from "@/core/ui/blocks";

/** Bloc du module sur la page d'accueil. */
export async function QuizHomeBlock() {
  const t = await getT();
  return (
    <HomeBlockCard
      icon="quiz"
      title={t("quiz.block.title")}
      text={t("quiz.block.text")}
      href="/quiz"
      linkLabel={t("core.block.open")}
    />
  );
}
