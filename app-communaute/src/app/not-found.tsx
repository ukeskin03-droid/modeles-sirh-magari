/** Page affichée quand une adresse n'existe pas. */
import { Suspense } from "react";
import { getT } from "@/core/request/context";
import { ButtonLink } from "@/core/ui/elements";
import { PageLoading } from "@/core/ui/PageLoading";

async function NotFoundContent() {
  const t = await getT();
  return (
    <main id="contenu" className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">{t("core.notFound.title")}</h1>
      <p className="mt-2 text-muted">{t("core.notFound.text")}</p>
      <ButtonLink href="/" className="mt-6">
        {t("core.notFound.back")}
      </ButtonLink>
    </main>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NotFoundContent />
    </Suspense>
  );
}
