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
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
  // Taille maximale d'un envoi de fichier (images, imports, packs .zip).
  experimental: {
    serverActions: { bodySizeLimit: "60mb" },
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
