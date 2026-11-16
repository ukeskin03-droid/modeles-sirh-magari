import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuizHistoryPage } from "@/modules/quiz/ui/QuizHistoryPage";

export const generateMetadata = titleFrom("quiz.history.title");

export default modulePage("quiz", QuizHistoryPage);
