import {useState} from 'react';
import {setRightPanelContent} from 'app/Layout/Layout';
import {ToolbarIconToggleButton} from 'ui/buttons/ToolbarIconButton';
import {useOngletTracker} from 'core-logic/hooks/useOngletTracker';
import {TIndicateurReferentielDefinition} from './types';

export type TIndicateurSidePanelProps = {
  definition: TIndicateurReferentielDefinition;
};

// identifiant du panneau actif (correspond à l'identifiant de l'icône associée)
type TPanelId = 'info' | false;

/**
 * Affiche le panneau latéral d'une page indicateur prédéfini
 */
export const IndicateurSidePanel = (props: TIndicateurSidePanelProps) => {
  const {definition} = props;

  // panneau ouvert
  const [panelId, setPanelId] = useState<TPanelId>(false);

  if (!definition?.description) {
    return null;
  }

  return (
    <>
      {/** boutons d'ouverture/fermeture des panneaux */}
      <IndicateurSidePanelToolbar panelId={panelId} setPanelId={setPanelId} />
      {/** panneau d'information */}
      {panelId === 'info'
        ? setRightPanelContent(
            <>
              <div className="flex justify-between fr-px-2w fr-py-1w">
                <button
                  className="text-gray-400 fr-icon-close-line hover:bg-gray-50"
                  onClick={() => setPanelId(false)}
                />
                <IndicateurSidePanelToolbar
                  panelId={panelId}
                  setPanelId={setPanelId}
                />
              </div>{' '}
              <IndicateurInfoPanel definition={definition} />
            </>
          )
        : null}
    </>
  );
};

export type TActionToolbarProps = {
  /** Identifiant du panneau latéral ouvert (ou `false` si le panneau est fermé) */
  panelId: TPanelId;
  /** Appeler pour ouvrir/fermer un panneau */
  setPanelId: (panelId: TPanelId) => void;
};

// correspondances entre les identifiants des panneaux et les identifiants de tracking
const panelIdToTrackerId: Record<string, 'informations'> = {
  info: 'informations',
};

/** Affiche la barre d'outils permettant d'ouvrir/fermer le panneau latéral */
const IndicateurSidePanelToolbar = ({
  panelId,
  setPanelId,
}: TActionToolbarProps) => {
  const tracker = useOngletTracker();

  const handleClick = (value: string | false) => {
    // ouvre/ferme un panneau
    setPanelId(value as TPanelId);
    const id = value && panelIdToTrackerId[value];

    // enregistre quand un panneau est ouvert
    if (id) {
      tracker(id);
    }
  };

  return (
    <div className="flex gap-4">
      <ToolbarIconToggleButton
        icon="info"
        title="Informations"
        active={panelId}
        onClick={handleClick}
      />
    </div>
  );
};

const IndicateurInfoPanel = ({definition}: TIndicateurSidePanelProps) => {
  return (
    <div className="overflow-y-auto fr-px-3w fr-py-2w">
      <div
        className="fr-text--sm"
        dangerouslySetInnerHTML={{__html: definition.description}}
      />
    </div>
  );
};
