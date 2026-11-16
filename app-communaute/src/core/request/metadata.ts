/**
 * Titre de l'onglet du navigateur, à partir d'un libellé (vocabulaire de la communauté compris).
 * Usage dans une page :  export const generateMetadata = titleFrom("quiz.page.title");
 */
import type { Metadata } from "next";
import { getT } from "./context";

export function titleFrom(labelKey: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getT();
    return { title: t(labelKey) };
  };
}
