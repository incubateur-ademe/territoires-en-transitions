import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import { useIsDemarchePcaetEnabled } from '@/app/demarches/pcaet/use-is-enabled';
import { useCurrentCollectivite } from '@tet/api/collectivites';

/**
 * Le bandeau ne s'affiche que sur un plan réellement rattaché à une démarche
 * — pas sur tout plan du type PCAET — quel que soit le statut de celle-ci :
 * une démarche adoptée reste liée à son plan, le raccourci doit persister.
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
