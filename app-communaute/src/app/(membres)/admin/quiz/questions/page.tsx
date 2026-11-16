import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuestionsAdminPage } from "@/modules/quiz/ui/QuestionsAdminPage";

export const generateMetadata = titleFrom("quiz.questions.title");

export default moduleAdminPage("quiz", "quiz.manage", QuestionsAdminPage);
