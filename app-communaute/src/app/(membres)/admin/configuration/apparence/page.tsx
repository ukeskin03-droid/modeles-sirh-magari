/** CONFIGURATION › étape « apparence » */
import { saveThemeAction } from "@/core/actions/setup";
import { getCommunity, getT } from "@/core/request/context";
import { ThemeEditor } from "@/core/setup/ThemeEditor";
import { FONT_KEYS, type FontKey } from "@/core/theme/fonts";
import { Card } from "@/core/ui/elements";
import { ActionForm } from "@/core/ui/forms";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardButtons, WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.apparence");

async function ApparenceStep() {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  return (
    <WizardFrame current="apparence" wide>
      <Card>
        <ActionForm action={saveThemeAction} className="space-y-6">
          <ThemeEditor
            initial={{ ...community.theme.colors, font: community.theme.font }}
            labels={{
              primary: t("core.config.theme.primary"),
              accent: t("core.config.theme.accent"),
              font: t("core.config.theme.font"),
              fonts: Object.fromEntries(FONT_KEYS.map((key) => [key, t(`core.font.${key}`)])) as Record<FontKey, string>,
              preview: t("core.config.theme.preview"),
              light: t("core.config.theme.light"),
              dark: t("core.config.theme.dark"),
              sampleTitle: t("core.config.theme.sample.title"),
              sampleText: t("core.config.theme.sample.text"),
              sampleMuted: t("core.config.theme.sample.muted"),
              sampleButton: t("core.config.theme.sample.button"),
              sampleSecondary: t("core.config.theme.sample.secondary"),
              sampleLink: t("core.config.theme.sample.link"),
              sampleBadge: t("core.config.theme.sample.badge"),
              warning: t("core.config.theme.warning"),
              warningColors: { primary: t("core.config.theme.warning.primary"), accent: t("core.config.theme.warning.accent") },
              warningModes: { light: t("core.config.theme.warning.light"), dark: t("core.config.theme.warning.dark") },
              ok: t("core.config.theme.ok"),
            }}
          />
          <WizardButtons current="apparence" />
        </ActionForm>
      </Card>
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", ApparenceStep);
