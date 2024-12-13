import { useActionDownToTache } from '@/app/core-logic/hooks/referentiel';
import { Referentiel } from '@/app/types/litterals';
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';

const ActionReferentielAvancement = lazy(
  () => import('@/app/app/pages/collectivite/Referentiels/Action')
);

export const ActionPage = () => {
  const { actionId } = useParams<{
    collectiviteId: string;
    actionId: string;
  }>();

  const [referentiel, identifiant] = actionId.split('_');

  const actions = useActionDownToTache(referentiel as Referentiel, identifiant);
  const action = actions.find((a) => a.id === actionId);

  return (
    <Suspense fallback={renderLoader()}>
      <CollectivitePageLayout>
        {action && <ActionReferentielAvancement action={action} />}
      </CollectivitePageLayout>
    </Suspense>
  );
};
