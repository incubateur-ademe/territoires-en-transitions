import { useCurrentCollectivite } from '@tet/api/collectivites';

export function useIsScoreIndicatifAllowed() {
  const collectivite = useCurrentCollectivite();
  const { hasCollectivitePermission } = collectivite;
  return hasCollectivitePermission('collectivites.read_confidentiel');
}
