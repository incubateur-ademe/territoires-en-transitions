import { HistoriqueListe } from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { FichesActionLiees } from '@/app/referentiels/action.show/FichesActionLiees';
import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { useGetAction } from '@/app/referentiels/actions/use-get-action';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { ReferentielId } from '@tet/domain/referentiels';
import { ReactNode } from 'react';
import { CommentsPanelContent } from './comments';
import { DocumentsPanelContent } from './documents';
import { IndicateursPanelContent } from './indicateurs';
import { InformationsPanelContent } from './informations';
import { ActionPanelId, ActionPanelIdEnum } from './types';

export function SidePanelInnerContent({
  panelId,
  targetActionId,
  referentielId,
  action,
  setTitle,
}: {
  panelId: ActionPanelId;
  targetActionId?: string;
  referentielId: ReferentielId;
  action: ActionListItem;
  setTitle: (title: string) => void;
}): ReactNode {
  const actionId = action.actionId;

  const targetAction = useGetAction({
    actionId: targetActionId ?? action.actionId,
  });

  switch (panelId) {
    case ActionPanelIdEnum.COMMENTS: {
      const commentAction = targetAction ?? action;
      return (
        <ReferentielProvider referentielId={referentielId}>
          <ActionProvider actionId={commentAction.actionId}>
            <CommentsPanelContent
              action={commentAction}
              updateTitlePanel={setTitle}
            />
          </ActionProvider>
        </ReferentielProvider>
      );
    }
    case ActionPanelIdEnum.DOCUMENTS: {
      return targetAction ? (
        <DocumentsPanelContent
          action={targetAction}
          subActionId={targetActionId}
        />
      ) : null;
    }
    case ActionPanelIdEnum.INDICATEURS:
      return (
        <ReferentielProvider referentielId={referentielId}>
          <ActionProvider actionId={actionId}>
            <IndicateursPanelContent />
          </ActionProvider>
        </ReferentielProvider>
      );
    case ActionPanelIdEnum.FICHES:
      return <FichesActionLiees actionId={actionId} />;
    case ActionPanelIdEnum.HISTORIQUE:
      return <HistoriqueListe actionId={actionId} small />;
    case ActionPanelIdEnum.INFORMATIONS: {
      const infoAction = targetAction ?? action;
      return infoAction ? (
        <InformationsPanelContent action={infoAction} />
      ) : null;
    }
  }
}
