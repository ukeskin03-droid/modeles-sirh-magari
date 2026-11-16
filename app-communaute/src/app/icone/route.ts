/** /icone — le favicon de la communauté (l'icône de l'onglet du navigateur). */
import { identityImageResponse } from "@/core/request/identity-image";

export async function GET(): Promise<Response> {
  return identityImageResponse("favicon");
}
