import { makeCollectivitePlansActionsListUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { EmptyCard } from '@tet/ui';
import { JSX } from 'react';

type PriorisationEmptyCardProps = {
  collectiviteId: number;
};

export const PriorisationEmptyCard = ({
  collectiviteId,
}: PriorisationEmptyCardProps): JSX.Element => (
  <EmptyCard
    variant="grey"
    size="xs"
    title={appLabels.priorisationVueBloqueeTitre}
    description={appLabels.priorisationVueBloqueeDescription}
    actions={[
      {
        children: appLabels.ajouterDesActions,
        icon: 'add-line',
        href: makeCollectivitePlansActionsListUrl({ collectiviteId }),
      },
    ]}
    className="max-w-md shadow-md"
  />
);
