import {useState} from 'react';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {setRightPanelContent} from 'app/Layout/Layout';
import {ToolbarIconToggleButton} from 'ui/buttons/ToolbarIconButton';
import ActionDiscussionsPanel from './ActionDiscussions/ActionDiscussionsPanel';
import {ActionInfoPanel} from './ActionInfo/ActionInfoPanel';
import {useOngletTracker} from 'core-logic/hooks/useOngletTracker';

export type TActionSidePanelProps = {
  action: ActionDefinitionSummary;
};

// identifiant du panneau actif (correspond à l'identifiant de l'icône associée)
type TPanelId = 'info' | 'question-answer' | false;

/**
 * Affiche le panneau latéral de la page action (infos, discussions)
 */
export const ActionSidePanel = (props: TActionSidePanelProps) => {
  const {action} = props;

  // panneau ouvert
  const [panelId, setPanelId] = useState<TPanelId>(false);

  // vérifie si on peut afficher la discussion
  const currentCollectivite = useCurrentCollectivite();
  const showDiscussion = Boolean(currentCollectivite?.niveau_acces);

  // la toolbar à afficher dans la page Action
  const Toolbar = () => (
    <ActionSidePanelToolbar
      panelId={panelId}
      setPanelId={setPanelId}
      showDiscussion={showDiscussion}
    />
  );
  // et la même pour les panneaux avec le bouton Fermer en plus
  const PanelToolbar = () => (
    <div className="flex justify-between fr-px-2w fr-py-1w">
      <button
        className="text-gray-400 fr-icon-close-line hover:bg-gray-50"
        onClick={() => setPanelId(false)}
      />
      <Toolbar />
    </div>
  );

  return (
    <>
      {/** boutons d'ouverture/fermeture des panneaux */}
      <Toolbar />
      {/** panneau de discussion */}
      {panelId === 'question-answer' && showDiscussion
        ? setRightPanelContent(
            <>
              <PanelToolbar />
              <ActionDiscussionsPanel action_id={action.id} />
            </>,
            {dataTest: 'ActionDiscussionsPanel'}
          )
        : null}
      {/** panneau d'information */}
      {panelId === 'info'
        ? setRightPanelContent(
            <>
              <PanelToolbar />
              <ActionInfoPanel action={action} />
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
  /** Indique si le bouton Commentaires doit être affiché */
  showDiscussion: boolean;
};

// correspondances entre les identifiants des panneaux et les identifiants de tracking
const panelIdToTrackerId: Record<string, 'informations' | 'commentaires'> = {
  info: 'informations',
  'question-answer': 'commentaires',
};

/** Affiche la barre d'outils permettant d'ouvrir/fermer le panneau latéral */
const ActionSidePanelToolbar = ({
  panelId,
  setPanelId,
  showDiscussion,
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
      {showDiscussion && (
        <ToolbarIconToggleButton
          data-test="ActionDiscussionsButton"
          icon="question-answer"
          title="Commentaires"
          active={panelId}
          onClick={handleClick}
        />
      )}
    </div>
  );
};
