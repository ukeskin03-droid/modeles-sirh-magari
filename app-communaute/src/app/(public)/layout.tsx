/**
 * GABARIT DES PAGES PUBLIQUES (connexion, installation, invitation) : une carte
 * centrée, sous le logo et le nom de la communauté.
 */
import { Suspense, type ReactNode } from "react";
import { displayName } from "@/core/community/translator";
import { getCommunity, getT } from "@/core/request/context";

async function CommunityIdentity() {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  return (
    <div className="mb-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'application */}
      <img src="/logo" alt="" width={64} height={64} className="mx-auto size-16 rounded-2xl object-contain" />
      <p className="mt-3 text-xl font-bold">{displayName(community, t)}</p>
      {community.subtitle && <p className="mt-1 text-sm text-muted">{community.subtitle}</p>}
    </div>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main id="contenu" className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<div aria-hidden="true" className="mb-6 h-28" />}>
          <CommunityIdentity />
        </Suspense>
        {children}
      </div>
    </main>
  );
}
