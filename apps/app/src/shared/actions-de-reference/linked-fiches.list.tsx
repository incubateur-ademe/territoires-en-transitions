import { appLabels } from '@/app/labels/catalog';
import { FicheCard } from '@/app/plans/fiches/components/card/fiche.card';
import type { CollectiviteCurrent } from '@tet/api/collectivites';
import type { JSX } from 'react';
import type { ActionDeReferenceFiche } from './actions-de-reference.contract';
import { toFicheLink } from './fiche-link.utils';

type LinkedFichesListProps = {
  readonly fiches: readonly ActionDeReferenceFiche[];
  readonly currentCollectivite: CollectiviteCurrent;
  readonly currentUserId: string;
};

const LinkedFichesList = ({
  fiches,
  currentCollectivite,
  currentUserId,
}: LinkedFichesListProps): JSX.Element => {
  const fichesOfOtherCollectivites = fiches.filter(
    ({ collectiviteId }) =>
      collectiviteId !== currentCollectivite.collectiviteId
  );

  if (fichesOfOtherCollectivites.length === 0) {
    return (
      <p className="mb-0 text-grey-8">
        {appLabels.actionDeReferenceFichesLieesVide}
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {fichesOfOtherCollectivites.map((fiche) => (
        <li key={fiche.id}>
          <FicheCard
            ficheAction={fiche}
            link={toFicheLink(fiche)}
            currentCollectivite={currentCollectivite}
            currentUserId={currentUserId}
          />
        </li>
      ))}
    </ul>
  );
};

export { LinkedFichesList };
