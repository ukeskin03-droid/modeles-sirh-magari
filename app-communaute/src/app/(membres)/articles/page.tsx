import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { KnowledgeHomePage } from "@/modules/knowledge/ui/KnowledgeHomePage";

export const generateMetadata = titleFrom("knowledge.page.title");

// modulePage vérifie que le module « knowledge » est actif ; sinon, retour à l'accueil.
export default modulePage("knowledge", KnowledgeHomePage, { trackView: true });
