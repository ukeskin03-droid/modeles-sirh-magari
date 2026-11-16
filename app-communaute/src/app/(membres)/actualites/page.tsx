import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { NewsHomePage } from "@/modules/news/ui/NewsHomePage";

export const generateMetadata = titleFrom("news.page.title");

// modulePage vérifie que le module « news » est actif ; sinon, retour à l'accueil.
export default modulePage("news", NewsHomePage, { trackView: true });
