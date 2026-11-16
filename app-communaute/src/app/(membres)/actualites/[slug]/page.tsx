import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { NewsDetailPage } from "@/modules/news/ui/NewsDetailPage";

export const generateMetadata = titleFrom("news.page.title");

export default modulePage("news", NewsDetailPage);
