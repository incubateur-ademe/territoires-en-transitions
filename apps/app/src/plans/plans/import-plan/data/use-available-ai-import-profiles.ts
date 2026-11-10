import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  AiPlanImportProfileEnum,
  type AiPlanImportProfile,
} from '@tet/domain/plans';
import { useIsAiPlanImportEnabled } from '../use-is-ai-plan-import-enabled';

/** Le flag UI historique ouvre les imports génériques et PCAET. */
export const useAvailableAiImportProfiles = () => {
  const trpc = useTRPC();
  const collectivite = useCurrentCollectivite();
  const aiImportEnabled = useIsAiPlanImportEnabled();
  const canImport = collectivite.hasCollectivitePermission(
    'plans.fiches.import'
  );
  const query = useQuery(
    trpc.plans.aiImport.getAiImportCapabilities.queryOptions(
      { collectiviteId: collectivite.collectiviteId },
      { enabled: canImport, retry: false }
    )
  );
  const profiles: AiPlanImportProfile[] = aiImportEnabled
    ? [AiPlanImportProfileEnum.GENERIC, AiPlanImportProfileEnum.PCAET]
    : [];
  for (const capability of query.data?.profiles ?? []) {
    if (
      capability.profile !== AiPlanImportProfileEnum.GENERIC &&
      capability.profile !== AiPlanImportProfileEnum.PCAET &&
      capability.available &&
      canImport
    ) {
      profiles.push(capability.profile);
    }
  }
  return { profiles, isLoading: canImport && query.isPending };
};
