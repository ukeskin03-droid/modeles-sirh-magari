/**
 * ACTUALITÉS — éléments d'affichage partagés.
 */
import type { Translator } from "@/core/i18n/translate";
import { Badge, type Tone } from "@/core/ui/elements";
import type { NewsState } from "../model";

const STATE_TONES: Record<NewsState, Tone | "neutral"> = { draft: "neutral", scheduled: "info", published: "success", expired: "warning", archived: "neutral" };

export function StateBadge({ state, t }: { state: NewsState; t: Translator }) {
  return <Badge tone={STATE_TONES[state]}>{t(`news.state.${state}`)}</Badge>;
}
