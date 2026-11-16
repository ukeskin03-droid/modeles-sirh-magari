/**
 * GABARIT RACINE — la « coquille » commune à toutes les pages.
 *
 * Cette coquille est fixe : elle ne contient rien de propre à une communauté. Tout ce
 * qui en dépend arrive par des adresses servies à chaque visite :
 *   /theme.css → couleurs et police de la communauté ;
 *   /icone     → son favicon.
 */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { displayName } from "@/core/community/translator";
import { getCommunity, getT } from "@/core/request/context";
import { THEME_BOOT_SCRIPT } from "@/core/ui/ThemeToggle";
import "./globals.css";

/** Titre de l'onglet et description : le nom et le sous-titre de la communauté. */
export async function generateMetadata(): Promise<Metadata> {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  const name = displayName(community, t);
  return {
    title: { default: name, template: `%s · ${name}` },
    description: community.subtitle || undefined,
    icons: { icon: "/icone" },
    // Communauté privée : on demande aux moteurs de recherche de ne pas la référencer.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning : le script ci-dessous peut ajouter l'attribut data-theme
    // avant que React ne prenne la main ; ce n'est pas une anomalie.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* eslint-disable-next-line @next/next/no-css-tags -- feuille de style calculée par l'application pour chaque communauté */}
        <link rel="stylesheet" href="/theme.css" />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
