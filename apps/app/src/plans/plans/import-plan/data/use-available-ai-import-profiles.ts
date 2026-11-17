import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/** Le serveur combine profils autorisés, flags et conditions d'accès. */
export const useAvailableAiImportProfiles = () => {
  const trpc = useTRPC();
  const collectivite = useCurrentCollectivite();
  const canImport = collectivite.hasCollectivitePermission(
    'plans.fiches.import'
  );
  const query = useQuery(
    trpc.plans.aiImport.getAiImportCapabilities.queryOptions(
      { collectiviteId: collectivite.collectiviteId },
      { enabled: canImport, retry: false }
    )
  );
  const profiles = (query.data?.profiles ?? [])
    .filter(({ available }) => available && canImport)
    .map(({ profile }) => profile);
  return { profiles, isLoading: canImport && query.isPending };
};
