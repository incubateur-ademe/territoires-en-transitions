import { HistoriqueListe } from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { FichesActionLiees } from '@/app/referentiels/action.show/FichesActionLiees';
import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ReferentielId } from '@tet/domain/referentiels';
import { ReactNode } from 'react';
import { CommentsPanelContent } from './comments';
import { DocumentsPanelContent } from './documents';
import { IndicateursPanelContent } from './indicateurs';
import { InformationsPanelContent } from './informations';
import { ActionPanelId } from './types';

export function SidePanelInnerContent({
  panelId,
  targetActionId,
  actionId,
  referentielId,
  actionDefinition,
  actionDescendants,
  setTitle,
}: {
  panelId: ActionPanelId;
  targetActionId?: string;
  actionId: string;
  referentielId: ReferentielId;
  actionDefinition?: ActionDefinitionSummary;
  actionDescendants: ActionDefinitionSummary[];
  setTitle: (title: string) => void;
}): ReactNode {
  switch (panelId) {
    case 'comments': {
      const commentActionId = targetActionId ?? actionId;
      return (
        <ReferentielProvider referentielId={referentielId}>
          <ActionProvider actionId={commentActionId}>
            <CommentsPanelContent
              referentielId={referentielId}
              parentActionId={actionId}
              actionId={commentActionId}
              updateTitlePanel={setTitle}
            />
          </ActionProvider>
        </ReferentielProvider>
      );
    }
    case 'documents': {
      const targetDefinition = targetActionId
        ? actionDescendants.find((a) => a.id === targetActionId)
        : actionDefinition;
      return targetDefinition ? (
        <DocumentsPanelContent
          actionDefinition={targetDefinition}
          subActionId={targetActionId}
        />
      ) : null;
    }
    case 'indicateurs':
      return (
        <ReferentielProvider referentielId={referentielId}>
          <ActionProvider actionId={actionId}>
            <IndicateursPanelContent />
          </ActionProvider>
        </ReferentielProvider>
      );
    case 'fiches':
      return <FichesActionLiees actionId={actionId} />;
    case 'historique':
      return <HistoriqueListe actionId={actionId} small />;
    case 'informations':
      return actionDefinition ? (
        <InformationsPanelContent actionDefinition={actionDefinition} />
      ) : null;
  }
}
