/**
 * PAGE D'ACCUEIL
 *
 * Elle est propre à chaque communauté : texte d'accueil et blocs choisis dans sa
 * configuration. Les blocs viennent du registre : seuls ceux des modules actifs
 * s'affichent, dans l'ordre choisi par la communauté.
 */
import { displayName } from "@/core/community/translator";
import { homeBlocksFor } from "@/core/modules/registry";
import { getActiveModules, getCommunity, getT, requireViewer } from "@/core/request/context";
import { memberPage } from "@/core/request/pages";
import { EmptyState, PageContainer } from "@/core/ui/elements";

async function HomePage() {
  const [viewer, community, t, active] = await Promise.all([requireViewer(), getCommunity(), getT(), getActiveModules()]);
  const blocks = homeBlocksFor(active, community.home.blocks);
  const firstName = viewer.name.trim().split(/\s+/)[0];
  const paragraphs = community.home.welcomeText.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <PageContainer>
      <section className="rounded-2xl bg-primary px-6 py-8 text-on-primary sm:px-10 sm:py-10">
        <p className="text-sm font-semibold">{t("core.home.greeting", { name: firstName })}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {community.home.welcomeTitle || displayName(community, t)}
        </h1>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mt-3 max-w-2xl whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </section>

      <h2 className="mb-4 mt-10 text-lg font-semibold">{t("core.home.blocks")}</h2>
      {blocks.length === 0 ? (
        <EmptyState title={t("core.home.empty.title")} text={t("core.home.empty.text")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <block.Component key={block.id} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default memberPage(HomePage);
