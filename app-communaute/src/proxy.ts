/**
 * PROXY — exécuté avant chaque page.
 *
 * Rôle : renvoyer tout de suite vers la connexion un visiteur qui n'a pas de cookie de
 * session. Ce n'est qu'un premier filtre, rapide : la vraie vérification (session
 * valable, droits, module actif) est faite par chaque page (src/core/request/pages.tsx).
 */
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath, SESSION_COOKIE } from "@/core/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname) || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/connexion", request.url);
  if (pathname !== "/") login.searchParams.set("suite", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // Le proxy ne s'applique pas aux fichiers techniques ni aux adresses qui se protègent elles-mêmes.
  matcher: ["/((?!_next/|api/|media/|l/|theme\\.css$|logo$|icone$|.*\\.[a-zA-Z0-9]+$).*)"],
};
