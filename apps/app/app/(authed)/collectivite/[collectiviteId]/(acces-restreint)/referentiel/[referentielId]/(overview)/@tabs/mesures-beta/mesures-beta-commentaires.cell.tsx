'use client';

import { getActionsAndSubActions } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import ActionCommentsSidePanelContent from '../../../action/[actionId]/_components/comments/action-comments-side-panel-content';
import { ActionProvider, useAction } from '@/app/referentiels/actions/action-context';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { isSousMesure, ReferentielId } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import type { MesureBetaRow } from './use-mesures-beta-table-data';

type Props = {
  row: MesureBetaRow;
  referentielId: ReferentielId;
};

function getParentActionId(actionId: string): string | undefined {
  const parts = actionId.split('.');
  if (parts.length <= 1) return undefined;
  return parts.slice(0, -1).join('.');
}

function ActionCommentsPanelWrapper({
  referentielId,
  parentActionId,
  actionId,
  updateTitlePanel,
  actionsAndSubActionsTitleList,
}: {
  referentielId: ReferentielId;
  parentActionId: string;
  actionId: string;
  updateTitlePanel: (title: string) => void;
  actionsAndSubActionsTitleList: {
    actionId: string;
    identifiant: string;
    nom: string;
  }[];
}) {
  const { data: action } = useAction();

  const actionsAndSubActions = isSousMesure(actionId, referentielId)
    ? actionsAndSubActionsTitleList
    : getActionsAndSubActions(action);

  return (
    <ActionCommentsSidePanelContent
      parentActionId={parentActionId}
      actionId={actionId}
      referentielId={referentielId}
      actionsAndSubActionsTitleList={actionsAndSubActions}
      updateTitlePanel={updateTitlePanel}
    />
  );
}

/** Fetches parent action to get siblings list, then renders comments panel */
function MesuresBetaCommentsPanelContent({
  actionId,
  parentActionId,
  referentielId,
  updateTitlePanel,
}: {
  actionId: string;
  parentActionId: string;
  referentielId: ReferentielId;
  updateTitlePanel: (title: string) => void;
}) {
  return (
    <ActionProvider actionId={parentActionId}>
      <ParentActionsLoader
        actionId={actionId}
        parentActionId={parentActionId}
        referentielId={referentielId}
        updateTitlePanel={updateTitlePanel}
      />
    </ActionProvider>
  );
}

function ParentActionsLoader({
  actionId,
  parentActionId,
  referentielId,
  updateTitlePanel,
}: {
  actionId: string;
  parentActionId: string;
  referentielId: ReferentielId;
  updateTitlePanel: (title: string) => void;
}) {
  const { data: parentAction } = useAction();
  const actionsAndSubActionsTitleList = getActionsAndSubActions(parentAction);

  return (
    <ActionProvider actionId={actionId}>
      <ActionCommentsPanelWrapper
        referentielId={referentielId}
        parentActionId={parentActionId}
        actionId={actionId}
        updateTitlePanel={updateTitlePanel}
        actionsAndSubActionsTitleList={actionsAndSubActionsTitleList}
      />
    </ActionProvider>
  );
}

export const MesuresBetaCommentairesCell = ({ row, referentielId }: Props) => {
  const { setPanel, setTitle } = useSidePanel();
  const parentActionId = getParentActionId(row.action_id) ?? row.action_id;

  const openCommentairesPanel = () => {
    setTitle(`Commentaires - ${row.identifiant} ${row.nom}`);
    setPanel({
      type: 'open',
      title: `Commentaires - ${row.identifiant}`,
      content: (
        <ReferentielProvider referentielId={referentielId}>
          <MesuresBetaCommentsPanelContent
            actionId={row.action_id}
            parentActionId={parentActionId}
            referentielId={referentielId}
            updateTitlePanel={(title) => setTitle(title)}
          />
        </ReferentielProvider>
      ),
    });
  };

  return (
    <td className="px-4 py-3">
      <Button
        variant="grey"
        size="sm"
        icon="chat-3-line"
        onClick={(e) => {
          e.stopPropagation();
          openCommentairesPanel();
        }}
      >
        Commentaires
      </Button>
    </td>
  );
};
