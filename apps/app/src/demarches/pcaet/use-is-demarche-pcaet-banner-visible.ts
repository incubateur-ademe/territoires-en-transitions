import { isPcaetPlan } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { useIsDemarchePcaetEnabled } from '@/app/demarches/pcaet/use-is-demarche-pcaet-enabled';

export function useIsDemarchePcaetBannerVisibleInPlan({
  planTypeLabel,
  canMutatePlans,
}: {
  planTypeLabel: string | null | undefined;
  canMutatePlans: boolean;
}) {
  const isDemarchePcaetEnabled = useIsDemarchePcaetEnabled();

  return isDemarchePcaetEnabled && isPcaetPlan(planTypeLabel) && canMutatePlans;
}
