import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuizEditPage } from "@/modules/quiz/ui/QuizEditPage";

export const generateMetadata = titleFrom("quiz.form.edit");

export default moduleAdminPage("quiz", "quiz.manage", QuizEditPage);
