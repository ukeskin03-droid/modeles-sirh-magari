/** CONFIGURATION › étape « categories » */
import { saveCategoriesAction } from "@/core/actions/setup";
import { db } from "@/core/db/client";
import { getT } from "@/core/request/context";
import { CategoryTreeEditor } from "@/core/setup/CategoryTreeEditor";
import { Alert, Card } from "@/core/ui/elements";
import { ActionForm } from "@/core/ui/forms";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardButtons, WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.categories");

async function CategoriesStep() {
  const t = await getT();
  const parents = await db().category.findMany({ where: { parentId: null }, orderBy: [{ position: "asc" }, { name: "asc" }], include: { children: { orderBy: [{ position: "asc" }, { name: "asc" }] } } });

  return (
    <WizardFrame current="categories">
      <Card>
        <ActionForm action={saveCategoriesAction} className="space-y-6">
          <CategoryTreeEditor
            initial={parents.map((parent) => ({ id: parent.id, name: parent.name, children: parent.children.map((child) => ({ id: child.id, name: child.name })) }))}
            labels={{
              add: t("core.config.categories.add"),
              addChild: t("core.config.categories.addChild"),
              name: t("core.config.categories.name"),
              childName: t("core.config.categories.childName"),
              empty: t("core.config.categories.empty"),
              drag: t("core.config.categories.drag"),
              moveUp: t("core.form.moveUp"),
              moveDown: t("core.form.moveDown"),
              remove: t("core.form.delete"),
            }}
          />
          <Alert>{t("core.config.categories.deleteNote")}</Alert>
          <WizardButtons current="categories" />
        </ActionForm>
      </Card>
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", CategoriesStep);
