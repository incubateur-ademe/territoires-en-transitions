'use client';

import CollectivitePageLayout from '@/app/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import { useActionDownToTache } from '@/app/referentiels/referentiel-hooks';
import { ReferentielId } from '@/domain/referentiels';
import ActionShow from './action.show';

export const ActionPage = ({ actionId }: { actionId: string }) => {
  const [referentielId, identifiant] = actionId.split('_');

  const actions = useActionDownToTache(
    referentielId as ReferentielId,
    identifiant
  );
  const action = actions.find((a) => a.id === actionId);

  return (
    <CollectivitePageLayout>
      {action && <ActionShow actionDefinition={action} />}
    </CollectivitePageLayout>
  );
};
