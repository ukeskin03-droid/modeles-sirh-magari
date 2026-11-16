import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuestionEditPage } from "@/modules/quiz/ui/QuestionEditPage";

export const generateMetadata = titleFrom("quiz.qform.new");

export default moduleAdminPage("quiz", "quiz.manage", QuestionEditPage);
