'use client';

import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { ActionCommentsTabContent } from './action-comments-tab-content';
export default function Page() {
  const referentielId = useReferentielId();

  const { data: actionList, isLoading: isLoadingActions } = useListActions({
    referentielIds: [referentielId],
    actionTypes: [ActionTypeEnum.ACTION],
  });

  const actionsAndSubActionsTitleList = actionList?.map((action) => ({
    actionId: action.actionId,
    identifiant: action.identifiant,
    nom: action.nom,
  }));

  if (isLoadingActions) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <section className="flex flex-col gap-5">
      <ActionCommentsTabContent
        referentielId={referentielId}
        actionsAndSubActionsTitleList={actionsAndSubActionsTitleList || []}
      />
    </section>
  );
}
