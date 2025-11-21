'use client';
import {
  ActionProvider,
  useAction,
} from '@/app/referentiels/actions/action-context';
import { getActionsAndSubActions } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { ReferentielId } from '@/domain/referentiels';
import ActionCommentsPanel from '../action-comments.panel';

// Component that wraps ActionCommentsPanel with ActionProvider and computes actionsAndSubActionsTitleList
function ActionCommentsPanelWrapper({
  referentielId,
  parentActionId,
  actionId,
  updateTitlePanel,
}: {
  referentielId: ReferentielId;
  parentActionId: string;
  actionId: string;
  updateTitlePanel: (title: string) => void;
}) {
  const { data: action } = useAction();
  const actionsAndSubActionsTitleList = getActionsAndSubActions(action);

  return (
    <ActionCommentsPanel
      isDisplayedAsPanel={true}
      parentActionId={parentActionId}
      actionId={actionId}
      referentielId={referentielId}
      actionsAndSubActionsTitleList={actionsAndSubActionsTitleList}
      updateTitlePanel={updateTitlePanel}
    />
  );
}

export const useCommentPanel = (
  referentielId: ReferentielId,
  parentActionId: string
) => {
  const { setPanel, setTitle, panel } = useSidePanel();

  const { data: action, isLoading } = useAction();

  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    action?.actionId ?? ''
  );

  const closePanel = () => {
    setPanel({ type: 'close' });
  };

  const openPanel = (actionId: string) => {
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
            />
          </ActionProvider>
        </ReferentielProvider>
      ),
    });
  };

  return {
    action,
    panel,
    isLoading,
    openPanel,
    closePanel,
  };
};
