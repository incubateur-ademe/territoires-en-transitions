'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Fournisseur d'identité mis en avant sur la modale de connexion : le premier
 * provider configuré côté backend (MonCompteAdeme, sinon ProConnect).
 */
export function useLoginUserWithOidc() {
  const trpc = useTRPC();

  const { data: statut } = useQuery(
    trpc.users.authentications.oidc.getStatus.queryOptions()
  );

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL as string;
  const targetProvider = statut?.targetProvider ?? null;

  return {
    backendUrl,
    targetProvider,
    /** Provider recommandé, mis en avant au-dessus des onglets existants. */
    recommended: !!backendUrl && !!statut?.enabled && targetProvider !== null,
  };
}
