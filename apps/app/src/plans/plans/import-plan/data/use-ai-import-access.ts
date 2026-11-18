import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { AiPlanImportProfile } from '@tet/domain/plans';

/** Le serveur combine profils autorisés, flags et conditions d'accès. */
export const useAiImportAccess = () => {
  const trpc = useTRPC();
  const collectivite = useCurrentCollectivite();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
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
  const isProfileAvailable = (profile: AiPlanImportProfile) =>
    profiles.includes(profile);

  return {
    profiles,
    isLoading: canImport && query.isPending,
    isAvailable: profiles.length > 0,
    isProfileAvailable,
    isSuperAdminRoleEnabled,
    isEntryPointVisible: profiles.length > 0,
  };
};
