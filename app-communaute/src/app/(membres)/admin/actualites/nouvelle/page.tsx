import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { NewsEditPage } from "@/modules/news/ui/NewsEditPage";

export const generateMetadata = titleFrom("news.form.new");

export default moduleAdminPage("news", "news.manage", NewsEditPage);
