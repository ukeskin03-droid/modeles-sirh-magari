import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { KnowledgeDetailPage } from "@/modules/knowledge/ui/KnowledgeDetailPage";

export const generateMetadata = titleFrom("knowledge.page.title");

export default modulePage("knowledge", KnowledgeDetailPage);
