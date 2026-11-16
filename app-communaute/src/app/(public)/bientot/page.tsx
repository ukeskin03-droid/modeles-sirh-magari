/**
 * PAGE D'ATTENTE — affichée à un lecteur tant que la communauté est « en préparation ».
 */
import { redirect } from "next/navigation";
import { logoutAction } from "@/core/actions/session";
import { getCommunity, getT, getViewer } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { publicPage } from "@/core/request/pages";
import { buttonClass, Card } from "@/core/ui/elements";

export const generateMetadata = titleFrom("core.soon.title");

async function SoonPage() {
  const [viewer, community, t] = await Promise.all([getViewer(), getCommunity(), getT()]);
  if (!viewer) redirect("/connexion");
  // La communauté a ouvert entre-temps (ou la personne n'est pas lectrice) : on entre.
  if (community.status === "open" || viewer.role !== "reader") redirect("/");

  return (
    <Card>
      <h1 className="text-xl font-bold">{t("core.soon.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("core.soon.text")}</p>
      <form action={logoutAction} className="mt-5">
        <button type="submit" className={buttonClass("secondary")}>
          {t("core.header.logout")}
        </button>
      </form>
    </Card>
  );
}

export default publicPage(SoonPage);
