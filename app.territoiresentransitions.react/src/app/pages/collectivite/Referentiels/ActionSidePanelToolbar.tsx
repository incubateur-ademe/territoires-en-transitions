import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useOngletTracker } from '@/app/core-logic/hooks/useOngletTracker';
import { ToolbarIconToggleButton } from '@/app/ui/buttons/ToolbarIconButton';
import { useEffect, useState } from 'react';
import {
  usePanelDispatch,
  usePanelState,
} from '../CollectivitePageLayout/Panel/PanelContext';
import ActionDiscussionsPanel from './ActionDiscussions/ActionDiscussionsPanel';
import { ActionInfoPanel } from './ActionInfo/ActionInfoPanel';

export type Props = {
  action: ActionDefinitionSummary;
};

// identifiant du panneau actif (correspond à l'identifiant de l'icône associée)
type TPanelId = 'info' | 'question-answer';

// correspondances entre les identifiants des panneaux et les identifiants de tracking
const panelIdToTrackerId: Record<string, 'informations' | 'commentaires'> = {
  info: 'informations',
  'question-answer': 'commentaires',
};

/** Affiche la barre d'outils permettant d'ouvrir/fermer le panneau latéral */
export const ActionSidePanelToolbar = ({ action }: Props) => {
  const currentCollectivite = useCurrentCollectivite();
  const tracker = useOngletTracker();

  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  const [panelId, setPanelId] = useState<TPanelId | false>(false);

  const isReadonly = currentCollectivite?.readonly ?? false;

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
        content: (
          <>
            {panelId === 'question-answer' && !isReadonly && (
              <ActionDiscussionsPanel
                dataTest="ActionDiscussionsPanel"
                action_id={action.id}
              />
            )}
            {panelId === 'info' && <ActionInfoPanel action={action} />}
          </>
        ),
      });
    }
  }, [panelId]);

  const handleClick = (value: string | false) => {
    setPanelId(value as TPanelId);

    // enregistre quand un panneau est ouvert
    const id = value && panelIdToTrackerId[value];

    if (id) {
      tracker(id);
    }
  };

  return (
    <Toolbar panelId={panelId} onClick={handleClick} isReadonly={isReadonly} />
  );
};

type ToolbarProps = {
  panelId: string | false;
  onClick: (v: string | false) => void;
  isReadonly: boolean;
};

const Toolbar = ({ panelId, onClick, isReadonly }: ToolbarProps) => {
  return (
    <div className="flex gap-4">
      <ToolbarIconToggleButton
        icon="info"
        title="Informations"
        active={panelId}
        onClick={onClick}
      />
      {!isReadonly && (
        <ToolbarIconToggleButton
          data-test="ActionDiscussionsButton"
          icon="question-answer"
          title="Commentaires"
          active={panelId}
          onClick={onClick}
        />
      )}
    </div>
  );
};
