/**
 * ADMINISTRATION › ÉTAT TECHNIQUE — pour vérifier que les mécanismes de fond tournent :
 * journal d'activité, tâches planifiées, notifications.
 */
import { runJobsAction } from "@/core/actions/admin";
import { activityOverview } from "@/core/activity/report";
import { db } from "@/core/db/client";
import { formatDateTime } from "@/core/i18n/format";
import { activityEventsCatalog, notificationEventsCatalog, scheduledTasksCatalog } from "@/core/modules/registry";
import { getCommunity, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { Badge, DataTable, EmptyState, PageContainer, PageHeader, type Tone } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

export const generateMetadata = titleFrom("core.admin.technical.title");

const STATUS_TONES: Record<string, Tone | "neutral"> = { pending: "neutral", running: "info", done: "success", sent: "success", failed: "danger" };

async function TechnicalPage() {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  const [overview, jobs, notifications] = await Promise.all([
    activityOverview(30),
    db().job.findMany({ orderBy: [{ uniqueKey: "asc" }, { runAt: "asc" }], take: 50 }),
    db().notification.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { user: { select: { name: true } } } }),
  ]);

  // Libellés des types d'événements, de tâches et de notifications, fournis par le registre.
  const eventLabels = new Map(activityEventsCatalog().map((event) => [event.type, t(event.labelKey)]));
  const taskLabels = new Map(scheduledTasksCatalog().map((task) => [task.type, t(task.labelKey)]));
  const notificationLabels = new Map(notificationEventsCatalog().map((event) => [event.event, t(event.labelKey)]));
  // Intervalle d'une tâche récurrente, dans l'unité la plus lisible.
  const intervalLabel = (minutes: number) =>
    minutes === 24 * 60
      ? t("core.admin.technical.jobs.everyDay")
      : minutes % 60 === 0
        ? t("core.admin.technical.jobs.everyHours", { count: minutes / 60 })
        : t("core.admin.technical.jobs.everyMinutes", { count: minutes });
  const statusBadge = (status: string) => <Badge tone={STATUS_TONES[status] ?? "neutral"}>{t(`core.status.${status}`)}</Badge>;

  return (
    <PageContainer>
      <PageHeader
        title={t("core.admin.technical.title")}
        description={t("core.admin.technical.description")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />

      <section aria-labelledby="titre-journal" className="mb-10">
        <h2 id="titre-journal" className="text-lg font-semibold">
          {t("core.admin.technical.activity.title")}
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          {t("core.admin.technical.activity.intro", { months: community.settings.activityRetentionMonths })}
        </p>
        {overview.latest.length === 0 ? (
          <EmptyState icon="activity" title={t("core.admin.technical.activity.empty")} />
        ) : (
          <div className="space-y-4">
            <DataTable
              caption={t("core.admin.technical.activity.summary")}
              headers={[t("core.admin.technical.col.type"), t("core.admin.technical.col.count")]}
            >
              {overview.byType.map((row) => (
                <tr key={row.type}>
                  <td className="px-4 py-2">{eventLabels.get(row.type) ?? row.type}</td>
                  <td className="px-4 py-2 tabular-nums">{row.count}</td>
                </tr>
              ))}
            </DataTable>
            <p className="text-sm text-muted">
              {t("core.admin.technical.activity.summary")} — {t("core.admin.technical.activity.distinct", { count: overview.distinctActors })}
            </p>
            <DataTable
              caption={t("core.admin.technical.activity.latest")}
              headers={[
                t("core.admin.technical.col.date"),
                t("core.admin.technical.col.type"),
                t("core.admin.technical.col.actor"),
                t("core.admin.technical.col.details"),
              ]}
            >
              {overview.latest.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-4 py-2">{formatDateTime(event.createdAt)}</td>
                  <td className="px-4 py-2">{eventLabels.get(event.type) ?? event.type}</td>
                  <td className="px-4 py-2 font-mono text-xs">{event.actor ? `${event.actor.slice(0, 8)}…` : "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{event.meta ? JSON.stringify(event.meta) : "—"}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
      </section>

      <section aria-labelledby="titre-taches" className="mb-10">
        <h2 id="titre-taches" className="text-lg font-semibold">
          {t("core.admin.technical.jobs.title")}
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">{t("core.admin.technical.jobs.intro")}</p>
        <ActionForm action={runJobsAction} className="mb-4">
          <SubmitButton variant="secondary">{t("core.admin.technical.jobs.run")}</SubmitButton>
        </ActionForm>
        {jobs.length === 0 ? (
          <EmptyState icon="clock" title={t("core.admin.technical.jobs.empty")} />
        ) : (
          <DataTable
            caption={t("core.admin.technical.jobs.title")}
            headers={[
              t("core.admin.technical.col.type"),
              t("core.admin.technical.col.next"),
              t("core.admin.technical.col.last"),
              t("core.admin.technical.col.status"),
              t("core.admin.technical.col.error"),
            ]}
          >
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-2">
                  {taskLabels.get(job.type) ?? job.type}
                  {job.everyMinutes && (
                    <span className="block text-xs text-muted">{intervalLabel(job.everyMinutes)}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2">{job.status === "pending" ? formatDateTime(job.runAt) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-2">{job.lastRunAt ? formatDateTime(job.lastRunAt) : "—"}</td>
                <td className="px-4 py-2">{statusBadge(job.status)}</td>
                <td className="px-4 py-2 text-xs">{job.lastError ?? "—"}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>

      <section aria-labelledby="titre-notifications">
        <h2 id="titre-notifications" className="mb-4 text-lg font-semibold">
          {t("core.admin.technical.notifications.title")}
        </h2>
        {notifications.length === 0 ? (
          <EmptyState icon="mail" title={t("core.admin.technical.notifications.empty")} />
        ) : (
          <DataTable
            caption={t("core.admin.technical.notifications.title")}
            headers={[
              t("core.admin.technical.col.date"),
              t("core.admin.technical.col.event"),
              t("core.admin.technical.col.status"),
              t("core.admin.technical.col.attempts"),
            ]}
          >
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td className="whitespace-nowrap px-4 py-2">{formatDateTime(notification.createdAt)}</td>
                <td className="px-4 py-2">
                  {notificationLabels.get(notification.event) ?? notification.event}
                  <span className="block text-xs text-muted">{notification.user.name}</span>
                </td>
                <td className="px-4 py-2">{statusBadge(notification.status)}</td>
                <td className="px-4 py-2 tabular-nums">{notification.attempts}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </PageContainer>
  );
}

export default adminPage("core.technical.view", TechnicalPage);
