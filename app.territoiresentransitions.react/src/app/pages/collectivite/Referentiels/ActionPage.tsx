import {lazy, Suspense} from 'react';
import {useParams} from 'react-router-dom';
import {renderLoader} from 'utils/renderLoader';
import {Referentiel} from 'types/litterals';
import {useActionDownToTache} from 'core-logic/hooks/referentiel';
import {ActionSidePanel} from './ActionSidePanel';

const ActionReferentielAvancement = lazy(
  () => import('app/pages/collectivite/Referentiels/Action')
);

export const ActionPage = () => {
  const {actionId} = useParams<{
    collectiviteId: string;
    actionId: string;
  }>();

  const [referentiel, identifiant] = actionId.split('_');

  const actions = useActionDownToTache(referentiel as Referentiel, identifiant);
  const action = actions.find(a => a.id === actionId);

  return (
    <Suspense fallback={renderLoader()}>
      {action && (
        <div data-test="Action" className="relative flex">
          <ActionReferentielAvancement action={action} />
          <ActionSidePanel action={action} />
        </div>
      )}
    </Suspense>
  );
};
