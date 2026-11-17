/**
 * RECHERCHE GLOBALE — une seule barre, qui ne cherche que dans les modules actifs.
 * Chaque recherche est notée dans le journal d'activité avec son nombre de résultats :
 * les recherches sans résultat révèlent les contenus qui manquent.
 */
import Link from "next/link";
import { after } from "next/server";
import { recordActivity } from "@/core/activity/log";
import { normalizeText } from "@/core/content/text";
import { getActiveModules, getT, requireViewer } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { memberPage } from "@/core/request/pages";
import { runSearch } from "@/core/search/service";
import { Button, EmptyState, INPUT_CLASS, PageContainer, PageHeader } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";

export const generateMetadata = titleFrom("core.search.title");

async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, t, viewer, active] = await Promise.all([searchParams, getT(), requireViewer(), getActiveModules()]);
  const query = q.trim().slice(0, 100);
  const { words, groups, total } = await runSearch(active, query, t);

  if (words.length > 0) {
    after(() => recordActivity({ type: "search.query", userId: viewer.id, meta: { query: normalizeText(query), results: total } }));
  }

  return (
    <PageContainer narrow>
      <PageHeader title={t("core.search.title")} />
      <form method="get" role="search" className="mb-8 flex gap-2">
        <label htmlFor="champ-recherche" className="sr-only">
          {t("core.search.label")}
        </label>
        <input id="champ-recherche" type="search" name="q" defaultValue={query} placeholder={t("core.search.placeholder")} minLength={2} maxLength={100} autoFocus={!query} className={`${INPUT_CLASS} min-w-0 flex-1`} />
        <Button type="submit">
          <Icon name="search" className="size-4" />
          {t("core.search.submit")}
        </Button>
      </form>

      {words.length === 0 ? (
        <p className="text-sm text-muted">{t("core.search.hint")}</p>
      ) : total === 0 ? (
        <EmptyState icon="search" title={t("core.search.none.title", { query })} text={t("core.search.none.text")} />
      ) : (
        <>
          <p role="status" className="mb-6 text-sm text-muted">
            {t("core.search.count", { count: total, query })}
          </p>
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.id}>
                <h2 className="mb-3 text-lg font-semibold">{group.label}</h2>
                <ul className="space-y-3">
                  {group.results.map((result) => (
                    <li key={result.id}>
                      <Link href={result.url} className="block rounded-xl border border-line bg-surface p-4 hover:border-primary-text/50 hover:bg-surface-2">
                        <span className="font-semibold">{result.title}</span>
                        {result.excerpt && <span className="mt-1 block text-sm text-muted">{result.excerpt}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}

export default memberPage(SearchPage);
