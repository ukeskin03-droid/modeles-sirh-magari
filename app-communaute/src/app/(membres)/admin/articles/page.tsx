import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { KnowledgeAdminPage } from "@/modules/knowledge/ui/KnowledgeAdminPage";

export const generateMetadata = titleFrom("knowledge.admin.title");

// moduleAdminPage vérifie que le module est actif ET que la personne a le droit « knowledge.manage ».
export default moduleAdminPage("knowledge", "knowledge.manage", KnowledgeAdminPage);
