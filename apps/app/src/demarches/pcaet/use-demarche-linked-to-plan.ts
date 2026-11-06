import { makeCollectiviteDemarchePcaetPlanActionsUrl } from '@/app/app/paths';
import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import { useIsDemarchePcaetEnabled } from '@/app/demarches/pcaet/use-is-enabled';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isDemarchePcaetEnCours } from '@tet/domain/demarches';

/**
 * Démarche PCAET qui tient le plan, quel que soit son statut : une démarche
 * adoptée reste liée à son plan, et son bandeau doit persister. Une démarche
 * en cours prime.
 */
export function useDemarcheLinkedToPlan({
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

  if (!isDemarchePcaetEnabled || !canMutatePlans) {
    return undefined;
  }
  const planLinks = links.filter((link) => link.planActionId === planId);
  const link =
    planLinks.find((planLink) => isDemarchePcaetEnCours(planLink.status)) ??
    planLinks[0];
  return link === undefined
    ? undefined
    : {
        ...link,
        planActionsUrl: makeCollectiviteDemarchePcaetPlanActionsUrl({
          collectiviteId,
          demarcheId: link.demarcheId,
        }),
      };
}
