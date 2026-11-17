/** CONFIGURATION — renvoie à l'étape en cours de l'assistant (ou à la première). */
import { redirect } from "next/navigation";
import { getActiveModules, getCommunity } from "@/core/request/context";
import { adminPage } from "@/core/request/pages";
import { setupSteps } from "@/core/setup/steps";

async function ConfigurationIndex() {
  const [community, active] = await Promise.all([getCommunity(), getActiveModules()]);
  const steps = setupSteps(active, community.setupStep !== null);
  redirect(steps[Math.min(community.setupStep ?? 0, steps.length - 1)].href);
  return null;
}

export default adminPage("core.community.configure", ConfigurationIndex);
