import {
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteTrajectoirelUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { EmptyCard, type EmptyCardAction } from '@tet/ui';
import { JSX } from 'react';
import { BlockedPriorisationAccess } from './data/to-priorisation-access';

type BlockedCardContent = {
  title: string;
  description: string;
  toActions: (collectiviteId: number) => EmptyCardAction[];
};

type PriorisationBlockedCardProps = {
  collectiviteId: number;
  access: BlockedPriorisationAccess;
};

const blockedCardContents: Record<
  BlockedPriorisationAccess,
  BlockedCardContent
> = {
  reservedToEpci: {
    title: appLabels.priorisationReserveeAuxEpciTitre,
    description: appLabels.priorisationReserveeAuxEpciDescription,
    toActions: () => [],
  },
  missingTrajectoire: {
    title: appLabels.priorisationTrajectoireManquanteTitre,
    description: appLabels.priorisationTrajectoireManquanteDescription,
    toActions: (collectiviteId) => [
      {
        children: appLabels.calculerMaTrajectoireSnbc,
        icon: 'line-chart-line',
        href: makeCollectiviteTrajectoirelUrl({ collectiviteId }),
      },
    ],
  },
  missingActions: {
    title: appLabels.priorisationVueBloqueeTitre,
    description: appLabels.priorisationVueBloqueeDescription,
    toActions: (collectiviteId) => [
      {
        children: appLabels.ajouterDesActions,
        icon: 'add-line',
        href: makeCollectivitePlansActionsListUrl({ collectiviteId }),
      },
    ],
  },
};

export const PriorisationBlockedCard = ({
  collectiviteId,
  access,
}: PriorisationBlockedCardProps): JSX.Element => {
  const { title, description, toActions } = blockedCardContents[access];
  return (
    <EmptyCard
      variant="grey"
      size="xs"
      title={title}
      description={description}
      actions={toActions(collectiviteId)}
      className="max-w-md shadow-md"
    />
  );
};
