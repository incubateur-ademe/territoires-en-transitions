import {useState} from 'react';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {setRightPanelContent} from 'app/Layout/Layout';
import {ToolbarIconToggleButton} from 'ui/shared/ToolbarIconButton';
import ActionDiscussionsPanel from './ActionDiscussions/ActionDiscussionsPanel';
import {ActionInfo} from './ActionInfo/ActionInfo';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

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
  const Toolbar = ({showCloseButton}: {showCloseButton?: boolean}) => (
    <ActionSidePanelToolbar
      {...props}
      panelId={panelId}
      setPanelId={setPanelId}
      showDiscussion={showDiscussion}
      showCloseButton={showCloseButton}
    />
  );
  // et la même pour les panneaux avec le bouton Fermer en plus
  const PanelToolbar = () => <Toolbar showCloseButton />;

  return (
    <div>
      {/** boutons d'ouverture/fermeture des panneaux */}
      <div className="absolute top-1 right-6">
        <Toolbar />
      </div>
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
              <ActionInfo action={action} />
            </>
          )
        : null}
    </div>
  );
};

export type TActionToolbarProps = {
  /** Identifiant du panneau latéral ouvert (ou `false` si le panneau est fermé) */
  panelId: TPanelId;
  /** Appeler pour ouvrir/fermer un panneau */
  setPanelId: (panelId: TPanelId) => void;
  /** Indique si le bouton "Fermer" doit être affiché */
  showDiscussion: boolean;
  /** Indique si le bouton Commentaires doit être affiché */
  showCloseButton?: boolean;
};

/** Affiche la barre d'outils permettant d'ouvrir/fermer le panneau latéral */
const ActionSidePanelToolbar = ({
  panelId,
  setPanelId,
  showCloseButton,
  showDiscussion,
}: TActionToolbarProps) => {
  return (
    <div className="hidden lg:flex w-full justify-between fr-p-2w">
      {showCloseButton ? (
        <button
          className="p-2 text-gray-400 fr-fi-arrow-right-s-line-double hover:bg-gray-50"
          onClick={() => setPanelId(false)}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-4">
        <ToolbarIconToggleButton
          icon="info"
          title="Informations"
          active={panelId}
          onClick={value => setPanelId(value as TPanelId)}
        />
        {showDiscussion && (
          <ToolbarIconToggleButton
            data-test="ActionDiscussionsButton"
            icon="question-answer"
            title="Commentaires"
            active={panelId}
            onClick={value => setPanelId(value as TPanelId)}
          />
        )}
      </div>
    </div>
  );
};
