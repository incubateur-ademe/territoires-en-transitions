import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import { useIsDemarchePcaetEnabled } from '@/app/demarches/pcaet/use-is-enabled';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/**
 * Le bandeau ne s'affiche que sur un plan réellement rattaché à une démarche
 * active — pas sur tout plan du type PCAET.
 */
export function useIsDemarchePcaetBannerVisibleInPlan({
  planId,
  canMutatePlans,
}: {
  planId: number;
  canMutatePlans: boolean;
}) {
  const isDemarchePcaetEnabled = useIsDemarchePcaetEnabled();
  const { collectiviteId } = useCurrentCollectivite();

  const { links } = useListDemarchePlanLinks(collectiviteId, {
    enabled: isDemarchePcaetEnabled && canMutatePlans,
  });

  return (
    isDemarchePcaetEnabled &&
    canMutatePlans &&
    links.some((link) => link.planActionId === planId)
  );
}
