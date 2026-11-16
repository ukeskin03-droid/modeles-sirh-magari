/**
 * ADMINISTRATION › MODULES — activer ou désactiver chaque module.
 */
import { toggleModuleAction } from "@/core/actions/admin";
import { allModules } from "@/core/modules/registry";
import { getActiveModules, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { Badge, PageContainer, PageHeader } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { Icon } from "@/core/ui/icons";

export const generateMetadata = titleFrom("core.admin.modules.title");

async function ModulesPage() {
  const [t, active] = await Promise.all([getT(), getActiveModules()]);
  const activeKeys = new Set(active.map((module) => module.key));

  return (
    <PageContainer narrow>
      <PageHeader
        title={t("core.admin.modules.title")}
        description={t("core.admin.modules.intro")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />
      <ul className="space-y-4">
        {allModules().map((module) => {
          const isActive = activeKeys.has(module.key);
          const name = t(module.nameKey);
          const requires = (module.requires ?? []).map((key) => allModules().find((other) => other.key === key)).filter((other) => other !== undefined);
          return (
            <li key={module.key} className="rounded-xl border border-line bg-surface p-5 shadow-xs">
              <div className="flex flex-wrap items-start gap-4">
                <span
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? "bg-primary-soft text-primary-text" : "bg-surface-2 text-muted"
                  }`}
                >
                  <Icon name={module.icon} />
                </span>
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{name}</h2>
                    <Badge tone={isActive ? "success" : "neutral"}>
                      {isActive ? t("core.admin.modules.active") : t("core.admin.modules.inactive")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{t(module.descriptionKey)}</p>
                  {requires.length > 0 && (
                    <p className="mt-1 text-sm text-muted">
                      {t("core.admin.modules.requires", { modules: requires.map((other) => t(other.nameKey)).join(", ") })}
                    </p>
                  )}
                </div>
                {/* Avant une désactivation, une fenêtre rappelle que les contenus sont conservés. */}
                <ActionForm
                  action={toggleModuleAction}
                  className="w-full sm:w-auto"
                  confirmation={
                    isActive
                      ? {
                          title: t("core.admin.modules.confirm.title", { module: name }),
                          text: t("core.admin.modules.confirm.text"),
                          confirm: t("core.admin.modules.disable"),
                          cancel: t("core.confirm.cancel"),
                          danger: true,
                        }
                      : undefined
                  }
                >
                  <input type="hidden" name="key" value={module.key} />
                  <input type="hidden" name="enabled" value={String(!isActive)} />
                  <SubmitButton variant={isActive ? "secondary" : "primary"} className="w-full sm:w-auto">
                    {isActive ? t("core.admin.modules.disable") : t("core.admin.modules.enable")}
                    <span className="sr-only"> : {name}</span>
                  </SubmitButton>
                </ActionForm>
              </div>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}

export default adminPage("core.community.configure", ModulesPage);
