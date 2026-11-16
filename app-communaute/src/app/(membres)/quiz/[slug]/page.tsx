import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuizDetailPage } from "@/modules/quiz/ui/QuizDetailPage";

export const generateMetadata = titleFrom("quiz.page.title");

export default modulePage("quiz", QuizDetailPage);
