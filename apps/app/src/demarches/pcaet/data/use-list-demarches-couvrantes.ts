'use client';

import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/** Les dépôts de Supra qui couvrent la collectivité courante. */
export const useListDemarchesCouvrantes = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const isPcaetSupraEnabled = useIsFeatureFlagEnabled('is-pcaet-supra-enabled');
  return useQuery(
    trpc.demarches.pcaet.listCouvrantes.queryOptions(
      { collectiviteId },
      { enabled: isPcaetSupraEnabled }
    )
  );
};
