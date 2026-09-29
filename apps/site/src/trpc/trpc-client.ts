import type { AppRouter, RouterOutput } from '@tet/api';
import { getTrpcLoggerLink, getTrpcUrl } from '@tet/api/utils/trpc/trpc.utils';
import { createTRPCClient, httpLink, TRPCClient } from '@trpc/client';

/**
 * Client tRPC du site, pour les procédures publiques du backend.
 *
 * Sans cookie de session : utilisable aussi bien dans un Server Component que
 * dans le navigateur.
 */
export function getSiteTrpcClient(): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [getTrpcLoggerLink(), httpLink({ url: getTrpcUrl() })],
  });
}

type SiteRouterOutput = RouterOutput['collectivites']['site'];

export type SiteCollectivite = NonNullable<SiteRouterOutput['getCollectivite']>;
export type SiteLabellisation = SiteCollectivite['labellisations'][number];
export type SiteIndicateurGes = NonNullable<
  SiteCollectivite['indicateursGazEffetSerre']
>[number];
export type SiteIndicateurArtificialisation = NonNullable<
  SiteCollectivite['indicateurArtificialisation']
>;
export type SiteCarte = SiteRouterOutput['listCarte'];
export type SiteCarteCollectivite = SiteCarte['collectivites'][number];
export type SiteCarteRegion = SiteCarte['regions'][number];
