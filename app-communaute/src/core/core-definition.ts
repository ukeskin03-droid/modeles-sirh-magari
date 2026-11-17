/**
 * LA FICHE DU MOTEUR
 *
 * Le moteur remplit la même fiche qu'un module pour tout ce qu'il apporte lui-même :
 * l'entrée de menu « Accueil », les écrans d'administration communs, les droits de base,
 * ses tâches planifiées et ses notifications. À la différence d'un module, il ne se
 * désactive pas.
 */
import { purgeActivityFromSettings } from "@/core/activity/log";
import { cleanupAuthData } from "@/core/auth/sessions";
import { coreLabels } from "@/core/i18n/labels.fr";
import type { Contribution } from "@/core/modules/types";
import { dispatchPendingNotifications } from "@/core/notifications/service";
import { cleanupTempFiles } from "@/core/uploads/temp";

export const coreDefinition: Contribution = {
  labels: coreLabels,

  navigation: [{ id: "core.home", labelKey: "core.nav.home", href: "/", icon: "home" }],

  adminScreens: [
    {
      id: "core.media",
      labelKey: "core.admin.media.title",
      descriptionKey: "core.admin.media.description",
      href: "/admin/medias",
      icon: "image",
      action: "core.media.manage",
    },
    {
      id: "core.import",
      labelKey: "core.admin.import.title",
      descriptionKey: "core.admin.import.description",
      href: "/admin/import",
      icon: "upload",
      action: "core.media.manage",
    },
    {
      id: "core.modules",
      labelKey: "core.admin.modules.title",
      descriptionKey: "core.admin.modules.description",
      href: "/admin/modules",
      icon: "modules",
      action: "core.community.configure",
    },
    {
      id: "core.settings",
      labelKey: "core.admin.settings.title",
      descriptionKey: "core.admin.settings.description",
      href: "/admin/parametres",
      icon: "settings",
      action: "core.community.configure",
    },
    {
      id: "core.pack",
      labelKey: "core.admin.pack.title",
      descriptionKey: "core.admin.pack.description",
      href: "/admin/pack",
      icon: "box",
      action: "core.community.configure",
    },
    {
      id: "core.users",
      labelKey: "core.admin.users.title",
      descriptionKey: "core.admin.users.description",
      href: "/admin/utilisateurs",
      icon: "users",
      action: "core.users.manage",
    },
    {
      id: "core.technical",
      labelKey: "core.admin.technical.title",
      descriptionKey: "core.admin.technical.description",
      href: "/admin/technique",
      icon: "activity",
      action: "core.technical.view",
    },
  ],

  actions: [
    // Entrer dans l'administration : éditeurs et administrateurs
    { key: "core.admin.access", minRole: "editor" },
    // Gérer les images : éditeurs et administrateurs
    { key: "core.media.manage", minRole: "editor" },
    // Tout ce qui touche à la configuration : administrateurs seulement
    { key: "core.community.configure", minRole: "admin" },
    { key: "core.users.manage", minRole: "admin" },
    { key: "core.technical.view", minRole: "admin" },
  ],

  activityEvents: [
    { type: "auth.login", labelKey: "core.activity.authLogin" },
    { type: "module.view", labelKey: "core.activity.moduleView" },
    { type: "content.view", labelKey: "core.activity.contentView" },
  ],

  notificationEvents: [
    {
      event: "user.invited",
      labelKey: "core.notification.userInvited",
      render: ({ payload, t, communityName, recipientName }) => ({
        subject: t("core.mail.invitation.subject", { community: communityName }),
        text: t("core.mail.invitation.body", {
          name: recipientName,
          community: communityName,
          link: String(payload.link ?? ""),
          days: String(payload.days ?? ""),
        }),
      }),
    },
  ],

  // Les fonctions sont appelées « paresseusement » (() => …) : elles ne sont lues qu'au
  // moment d'exécuter la tâche.
  scheduledTasks: [
    { type: "activity.purge", labelKey: "core.job.activityPurge", everyMinutes: 24 * 60, handler: async () => void (await purgeActivityFromSettings()) },
    { type: "notifications.dispatch", labelKey: "core.job.notificationsDispatch", everyMinutes: 5, handler: async () => void (await dispatchPendingNotifications()) },
    { type: "uploads.cleanup", labelKey: "core.job.uploadsCleanup", everyMinutes: 60, handler: async () => void (await cleanupTempFiles()) },
    { type: "auth.cleanup", labelKey: "core.job.authCleanup", everyMinutes: 24 * 60, handler: async () => void (await cleanupAuthData()) },
  ],
};
