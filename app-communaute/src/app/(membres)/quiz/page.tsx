import { modulePage } from "@/core/request/pages";
import { titleFrom } from "@/core/request/metadata";
import { QuizHomePage } from "@/modules/quiz/ui/QuizHomePage";

export const generateMetadata = titleFrom("quiz.page.title");

// modulePage vérifie que le module « quiz » est actif ; sinon, retour à l'accueil.
export default modulePage("quiz", QuizHomePage, { trackView: true });
