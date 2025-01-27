import { useActionDownToTache } from '@/app/referentiels/referentiel-hooks';
import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { ReferentielId } from '@/domain/referentiels';
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import CollectivitePageLayout from '../../app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';

const ActionShow = lazy(() => import('@/app/referentiels/actions/action.show'));

export const ActionPage = () => {
  const { actionId } = useParams<{
    collectiviteId: string;
    actionId: string;
  }>();

  const [referentiel, identifiant] = actionId.split('_');

  const actions = useActionDownToTache(
    referentiel as ReferentielId,
    identifiant
  );
  const action = actions.find((a) => a.id === actionId);

  return (
    <Suspense fallback={renderLoader()}>
      <CollectivitePageLayout>
        {action && <ActionShow actionDefinition={action} />}
      </CollectivitePageLayout>
    </Suspense>
  );
};
