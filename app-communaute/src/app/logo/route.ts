/** /logo — le logo de la communauté (visible sans connexion). */
import { identityImageResponse } from "@/core/request/identity-image";

export async function GET(): Promise<Response> {
  return identityImageResponse("logo");
}
