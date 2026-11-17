import type { NextConfig } from "next";

/**
 * Configuration de Next.js.
 *
 * - cacheComponents / partialPrefetching : modèle de rendu par défaut de Next.js 16.
 *   Dans cette application, tout ce qui dépend de la base de données est rendu
 *   à chaque visite (voir src/core/request/pages.tsx).
 * - experimental : relève la taille maximale des fichiers envoyés (1 Mo par défaut).
 * - serverExternalPackages : better-sqlite3 est un module natif, il ne doit pas
 *   être « empaqueté » avec le reste du code.
 * - allowedOrigins : voir ci-dessous.
 */

/**
 * Protection contre les envois de formulaires venus d'autres sites : Next.js vérifie
 * que la page qui envoie un formulaire a la même adresse que le serveur. Quand
 * l'application est derrière un relais (GitHub Codespaces, certains hébergeurs), le
 * serveur ne connaît que son adresse interne (localhost:3001) et refuse tout. On lui
 * indique donc son adresse publique, tirée de APP_URL. Ce réglage est relu à chaque
 * démarrage : pas besoin de reconstruire l'application quand APP_URL change.
 */
function allowedOrigins(): string[] {
  const origins: string[] = [];
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      origins.push(new URL(appUrl).host);
    } catch {
      // Adresse mal écrite : ignorée.
    }
  }
  // Filet de sécurité dans GitHub Codespaces : les adresses du relais du codespace.
  if (process.env.CODESPACES === "true") {
    origins.push(`*.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev"}`);
  }
  return origins;
}
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Même raison, pour le mode développement (npm run dev) ouvert à travers un relais.
  allowedDevOrigins: allowedOrigins(),
  serverExternalPackages: ["better-sqlite3"],
  // Taille maximale d'un envoi de fichier (images, imports, packs .zip).
  experimental: {
    serverActions: { bodySizeLimit: "60mb", allowedOrigins: allowedOrigins() },
    proxyClientMaxBodySize: "60mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
