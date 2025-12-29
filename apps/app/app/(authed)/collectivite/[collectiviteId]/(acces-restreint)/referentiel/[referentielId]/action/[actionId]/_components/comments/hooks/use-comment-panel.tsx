'use client';
import {
  ActionProvider,
  useAction,
} from '@/app/referentiels/actions/action-context';
import { getActionsAndSubActions } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { isSousMesure, ReferentielId } from '@tet/domain/referentiels';
import ActionCommentsSidePanelContent from '../action-comments-side-panel-content';

// Component that wraps ActionCommentsSidePanelContent with ActionProvider and computes actionsAndSubActionsTitleList
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

export const useCommentPanel = (
  referentielId: ReferentielId,
  parentActionId: string
) => {
  const { setPanel, setTitle, panel } = useSidePanel();

  const { data: action, isPending } = useAction();
  const { prevActionLink, nextActionLink } =
    usePrevAndNextActionLinks(parentActionId);

  const closePanel = () => {
    setPanel({ type: 'close' });
  };

  const openPanel = (actionId: string) => {
    const actionsAndSubActionsTitleList = getActionsAndSubActions(action);
    setPanel({
      type: 'open',
      isPersistentWithNextPath: (pathname) =>
        pathname === nextActionLink || pathname === prevActionLink,
      content: (
        <ReferentielProvider referentielId={referentielId}>
          <ActionProvider actionId={actionId}>
            <ActionCommentsPanelWrapper
              referentielId={referentielId}
              parentActionId={parentActionId}
              actionId={actionId}
              updateTitlePanel={(title: string) => {
                setTitle(title);
              }}
              actionsAndSubActionsTitleList={actionsAndSubActionsTitleList}
            />
          </ActionProvider>
        </ReferentielProvider>
      ),
    });
  };

  return {
    action,
    panel,
    isPending,
    openPanel,
    closePanel,
  };
};
