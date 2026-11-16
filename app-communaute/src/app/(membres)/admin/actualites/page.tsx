import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { NewsAdminPage } from "@/modules/news/ui/NewsAdminPage";

export const generateMetadata = titleFrom("news.admin.title");

// moduleAdminPage vérifie que le module est actif ET que la personne a le droit « news.manage ».
export default moduleAdminPage("news", "news.manage", NewsAdminPage);
