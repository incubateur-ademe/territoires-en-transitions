import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import useSWR from 'swr';

const trpcClient = getSiteTrpcClient();

export const useCarteCollectivitesEngagees = () => {
  // Réponse lourde (~2 Mo) et limitée en débit côté backend : pas de
  // revalidation au retour sur l'onglet.
  return useSWR(
    'site-collectivites-carte-engagees',
    () => trpcClient.collectivites.site.listCarte.query(),
    { revalidateOnFocus: false }
  );
};
