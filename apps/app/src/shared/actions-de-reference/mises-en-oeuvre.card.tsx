import { appLabels } from '@/app/labels/catalog';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import type { ActionDeReferenceId } from '@tet/domain/shared';
import { Card } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { useListFichesActionDeReference } from './data/use-list-fiches-action-de-reference';
import { MisesEnOeuvreList } from './mises-en-oeuvre.list';

const MisesEnOeuvreCard = ({
  actionDeReferenceId,
}: {
  readonly actionDeReferenceId: ActionDeReferenceId;
}): JSX.Element => {
  const fiches = useListFichesActionDeReference(actionDeReferenceId);
  const currentCollectivite = useCurrentCollectivite();
  const { id: currentUserId } = useUser();

  return (
    <Card className="gap-4 p-6 font-normal shadow-none">
      <h2 className="mb-0 text-lg font-bold text-primary-10">
        {appLabels.actionDeReferenceMisesEnOeuvreTitre}
      </h2>
      {match(fiches)
        .with({ status: 'loading' }, () => <LoadingStatus />)
        .with({ status: 'error' }, ({ retry }) => (
          <ErrorCard
            title={appLabels.uneErreurEstSurvenue}
            retry={retry}
            retryLabel={appLabels.reessayer}
          />
        ))
        .with({ status: 'loaded' }, (loaded) => (
          <MisesEnOeuvreList
            fiches={loaded.fiches}
            currentCollectivite={currentCollectivite}
            currentUserId={currentUserId}
          />
        ))
        .exhaustive()}
    </Card>
  );
};

export { MisesEnOeuvreCard };
