import {useEffect, useState} from 'react';

import {ToolbarIconToggleButton} from 'ui/buttons/ToolbarIconButton';
import {useOngletTracker} from 'core-logic/hooks/useOngletTracker';
import {TIndicateurPredefini} from './types';
import {
  usePanelDispatch,
  usePanelState,
} from '../CollectivitePageLayout/Panel/PanelContext';

// identifiant du panneau actif (correspond à l'identifiant de l'icône associée)
type TPanelId = 'info' | false;

// correspondances entre les identifiants des panneaux et les identifiants de tracking
const panelIdToTrackerId: Record<string, 'informations'> = {
  info: 'informations',
};

type TIndicateurSidePanelToolbarProps = {
  definition: TIndicateurPredefini;
};

/** Affiche la barre d'outils permettant d'ouvrir/fermer le panneau latéral */
export const IndicateurSidePanelToolbar = ({
  definition,
}: TIndicateurSidePanelToolbarProps) => {
  const tracker = useOngletTracker();

  const panelState = usePanelState();
  const panelDispatch = usePanelDispatch();

  const [panelId, setPanelId] = useState<TPanelId | false>(false);

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
        toolbar: <Toolbar panelId={panelId} onClick={handleClick} />,
        content: (
          <>
            {panelId === 'info' && (
              <div className="overflow-y-auto fr-px-3w fr-py-2w">
                <div
                  className="fr-text--sm"
                  dangerouslySetInnerHTML={{__html: definition.description!}}
                />
              </div>
            )}
          </>
        ),
      });
    }
  }, [panelId]);

  const handleClick = (value: string | false) => {
    // ouvre/ferme un panneau
    setPanelId(value as TPanelId);
    const id = value && panelIdToTrackerId[value];

    // enregistre quand un panneau est ouvert
    if (id) {
      tracker(id);
    }
  };

  if (!definition?.description) {
    return null;
  }

  return <Toolbar panelId={panelId} onClick={handleClick} />;
};

type ToolbarProps = {
  panelId: TPanelId;
  onClick: (v: string | false) => void;
};

const Toolbar = ({panelId, onClick}: ToolbarProps) => {
  return (
    <div className="flex gap-4">
      <ToolbarIconToggleButton
        icon="info"
        title="Informations"
        active={panelId}
        onClick={onClick}
      />
    </div>
  );
};
