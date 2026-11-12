import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import { useQuery } from '@tanstack/react-query';

const trpcClient = getSiteTrpcClient();

export const useCarteCollectivitesEngagees = () => {
  // Réponse lourde (~2 Mo) et limitée en débit côté backend : pas de
  // revalidation au retour sur l'onglet.
  return useQuery({
    queryKey: ['site-collectivites-carte-engagees'],
    queryFn: () => trpcClient.collectivites.site.listCarte.query(),
    refetchOnWindowFocus: false,
  });
};
