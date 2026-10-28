import { makeCollectivitePriorisationUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { BetaLabel } from '@/app/ui/beta.label';
import type { CollectiviteNavLink } from './make-collectivite-nav.contract';

export const generatePriorisationLink = ({
  collectiviteId,
  canReadPriorisation,
  isPriorisationEnabled,
}: {
  collectiviteId: number;
  canReadPriorisation: boolean;
  isPriorisationEnabled: boolean;
}): CollectiviteNavLink => ({
  isVisible: isPriorisationEnabled && canReadPriorisation,
  children: <BetaLabel>{appLabels.priorisationLeviersTitre}</BetaLabel>,
  href: makeCollectivitePriorisationUrl({ collectiviteId }),
  urlPrefix: [makeCollectivitePriorisationUrl({ collectiviteId })],
});
