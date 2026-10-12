import { makeCollectivitePriorisationUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { BetaLabel } from '@/app/ui/beta.label';
import type { CollectiviteNavLink } from './make-collectivite-nav.contract';

export const generatePriorisationLink = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
  isPriorisationEnabled,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
  isPriorisationEnabled: boolean;
}): CollectiviteNavLink => ({
  isVisible:
    isPriorisationEnabled && !(collectiviteAccesRestreint && isVisitor),
  children: <BetaLabel>{appLabels.outilsDePriorisation}</BetaLabel>,
  href: makeCollectivitePriorisationUrl({ collectiviteId }),
  urlPrefix: [makeCollectivitePriorisationUrl({ collectiviteId })],
});
