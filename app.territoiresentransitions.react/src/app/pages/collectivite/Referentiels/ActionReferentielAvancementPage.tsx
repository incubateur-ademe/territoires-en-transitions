import {lazy, Suspense} from 'react';
import {useParams} from 'react-router-dom';
import {renderLoader} from 'utils';

const ActionReferentielAvancement = lazy(
  () =>
    import('app/pages/collectivite/Referentiels/ActionReferentielAvancement')
);

export const ActionReferentielAvancementPage = () => {
  const {actionId} = useParams<{
    epciId: string;
    actionId: string;
  }>();

  return (
    <Suspense fallback={renderLoader()}>
      <ActionReferentielAvancement actionId={actionId} />
    </Suspense>
  );
};
