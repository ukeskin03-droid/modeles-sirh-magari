import { moduleAdminPage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuizAdminPage } from "@/modules/quiz/ui/QuizAdminPage";

export const generateMetadata = titleFrom("quiz.admin.title");

// moduleAdminPage vérifie que le module est actif ET que la personne a le droit « quiz.manage ».
export default moduleAdminPage("quiz", "quiz.manage", QuizAdminPage);
