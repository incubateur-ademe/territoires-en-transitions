import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Button, ButtonProps, Event, useEventTracker } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import {
  usePanelDispatch,
  usePanelState,
} from '../../app/pages/collectivite/CollectivitePageLayout/Panel/PanelContext';
import ActionDiscussionsPanel from './action-discussion/ActionDiscussionsPanel';

type Props = {
  action: ActionDefinitionSummary;
};

// identifiant du panneau actif (correspond à l'identifiant de l'icône associée)
type PanelId = 'question-answer';
type PanelValue = PanelId | false;

// correspondances entre les identifiants des panneaux et les identifiants de tracking
const panelIdToTrackerId: Record<string, 'commentaires'> = {
  'question-answer': 'commentaires',
};

/** Affiche la barre d'outils permettant d'ouvrir/fermer le panneau latéral */
export const ActionSidePanelToolbar = ({ action }: Props) => {
  const currentCollectivite = useCurrentCollectivite();
  const tracker = useEventTracker();

  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  const [panelId, setPanelId] = useState<PanelValue>(false);

  const isReadonly = currentCollectivite?.isReadOnly ?? false;

  useEffect(() => {
    !panelState.isOpen && setPanelId(false);
  }, [panelState.isOpen]);

  useEffect(() => {
    if (!panelId) {
      panelDispatch({
        type: 'close',
      });
    } else {
      panelDispatch({
        type: 'open',
        toolbar: (
          <Toolbar
            panelId={panelId}
            onClick={handleClick}
            isReadonly={isReadonly}
          />
        ),
        content: panelId === 'question-answer' && !isReadonly && (
          <ActionDiscussionsPanel
            dataTest="ActionDiscussionsPanel"
            action_id={action.id}
          />
        ),
      });
    }
  }, [panelId]);

  const handleClick = (value: PanelValue) => {
    setPanelId(value as PanelId);

    // enregistre quand un panneau est ouvert
    const id = value && panelIdToTrackerId[value];

    if (id) {
      tracker(Event.referentiels.openSidePanel, {
        panel: id,
      });
    }
  };

  return (
    <Toolbar panelId={panelId} onClick={handleClick} isReadonly={isReadonly} />
  );
};

type ToolbarProps = {
  panelId: PanelValue;
  onClick: (v: PanelValue) => void;
  isReadonly: boolean;
};

const Toolbar = ({ panelId, onClick, isReadonly }: ToolbarProps) => {
  return (
    !isReadonly && (
      <ToolbarButton
        dataTest="ActionDiscussionsButton"
        panelId="question-answer"
        isActive={panelId === 'question-answer'}
        iconFill="question-answer-fill"
        iconLine="question-answer-line"
        title="Commentaires"
        size="xs"
        className="ml-auto"
        onToggle={onClick}
      />
    )
  );
};

const ToolbarButton = ({
  isActive,
  iconFill,
  iconLine,
  onToggle,
  panelId,
  ...props
}: {
  panelId: PanelId;
  isActive: boolean;
  iconFill: string;
  iconLine: string;
  onToggle: (v: PanelValue) => void;
} & ButtonProps) => {
  return (
    <Button
      icon={isActive ? iconFill : iconLine}
      variant="grey"
      className={classNames({
        '!bg-grey-3 hover:!bg-grey-4': isActive,
      })}
      onClick={() => onToggle(isActive ? false : panelId)}
      {...props}
    />
  );
};
