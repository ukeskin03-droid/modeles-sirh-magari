import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { KnowledgeEditPage } from "@/modules/knowledge/ui/KnowledgeEditPage";

export const generateMetadata = titleFrom("knowledge.form.edit");

export default moduleAdminPage("knowledge", "knowledge.manage", KnowledgeEditPage);
