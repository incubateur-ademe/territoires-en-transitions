import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import { useQuery } from '@tanstack/react-query';

const trpcClient = getSiteTrpcClient();

export const useCarteCollectivitesEngagees = () => {
  // Réponse lourde (~2 Mo) et limitée en débit côté backend : chargée une
  // seule fois par session, sans comparaison profonde au rechargement.
  return useQuery({
    queryKey: ['site-collectivites-carte-engagees'],
    queryFn: () => trpcClient.collectivites.site.listCarte.query(),
    staleTime: Infinity,
    structuralSharing: false,
  });
};
