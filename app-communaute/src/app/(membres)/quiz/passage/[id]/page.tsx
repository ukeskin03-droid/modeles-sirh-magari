import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuizAttemptPage } from "@/modules/quiz/ui/QuizAttemptPage";

export const generateMetadata = titleFrom("quiz.page.title");

export default modulePage("quiz", QuizAttemptPage);
