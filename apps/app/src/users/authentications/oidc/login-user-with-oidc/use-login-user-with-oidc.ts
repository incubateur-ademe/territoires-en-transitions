'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * État de la « connexion unifiée » MonCompteAdeme pour les modales de
 * connexion/création : MonCompteAdeme est mis en avant dès qu'il est activé
 * côté backend (provider ciblé configuré).
 */
export function useLoginUserWithOidc() {
  const trpc = useTRPC();

  const { data: statut } = useQuery(
    trpc.users.authentications.oidc.getStatus.queryOptions()
  );

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL as string;
  const isMcaActive = !!backendUrl && !!statut?.enabled;

  return {
    backendUrl,
    /** MonCompteAdeme recommandé, mis en avant au-dessus des onglets existants. */
    recommended: isMcaActive,
  };
}
