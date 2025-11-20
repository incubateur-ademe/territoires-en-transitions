'use client';

import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import ActionCommentsPanel from '../../../action/[actionId]/_components/comments/action-comments.panel';

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
      <ActionCommentsPanel
        isDisplayedAsPanel={false}
        referentielId={referentielId}
        actionsAndSubActionsTitleList={actionsAndSubActionsTitleList || []}
      />
    </section>
  );
}
