import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useActionStatut} from 'core-logic/hooks/useActionStatut';
import {useEffect, useState} from 'react';
import {Accordion} from 'ui/Accordion';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {SuiviScoreRow} from '../data/useScoreRealise';
import SubActionDescription from './SubActionDescription';
import SubActionHeader from './SubActionHeader';
import SubActionPreuvesAccordion from './SubActionPreuvesAccordion';
import SubActionTasksList from './SubActionTasksList';

type SubActionCardProps = {
  subAction: ActionDefinitionSummary;
  actionScores: {[actionId: string]: SuiviScoreRow};
  forceOpen: boolean;
  onOpenSubAction: (isOpen: boolean) => void;
};

/**
 * Carte permettant l'affichage d'une sous-action
 * dans l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */

const SubActionCard = ({
  subAction,
  actionScores,
  forceOpen,
  onOpenSubAction,
}: SubActionCardProps): JSX.Element => {
  const collectivite_id = useCollectiviteId();
  const {statut, filled} = useActionStatut({
    action_id: subAction.id,
    collectivite_id: collectivite_id ?? 0,
  });
  const {avancement, concerne} = statut || {};
  const tasks = useActionSummaryChildren(subAction);

  const shouldDisplayProgressBar =
    concerne !== false &&
    (avancement === 'detaille' ||
      (avancement === 'non_renseigne' && filled === true) ||
      (statut === null && filled === true));

  const shouldHideTasksStatus =
    (statut !== null && statut?.avancement !== 'non_renseigne') ||
    statut?.concerne === false;

  const shouldOpen = true;

  // Condition à décommenter lorsque le statut à la sous-action sera possible
  // subAction.referentiel === 'eci' ||
  // (subAction.referentiel === 'cae' && statut?.avancement === 'detaille');

  const [openTasks, setOpenTasks] = useState(false);
  const [openSubAction, setOpenSubAction] = useState(forceOpen);

  // Mise à jour de l'ouverture / fermeture de la sous-action
  // en fonction du bouton "Tout déplier" / "Tout replier"
  useEffect(() => setOpenSubAction(forceOpen), [forceOpen]);

  // Mise à jour de l'ouverture / fermeture de la liste des tâches
  useEffect(() => {
    setOpenTasks(openSubAction ? shouldOpen : false);
  }, [openSubAction]);

  const handleToggleOpen = () => {
    onOpenSubAction(!openSubAction);
    setOpenSubAction(prevState => !prevState);
  };

  return (
    <div
      data-test={`SousAction-${subAction.identifiant}`}
      className="border border-[#e5e5e5] rounded-lg"
    >
      {/* En-tête */}
      <SubActionHeader
        action={subAction}
        actionScores={actionScores}
        displayProgressBar={shouldDisplayProgressBar}
        openSubAction={openSubAction}
        onToggleOpen={handleToggleOpen}
      />

      {/* Contenu */}
      {openSubAction && (
        <div className="p-6">
          {/* Commentaire associé à la sous-action */}
          <ActionCommentaire action={subAction} className="mb-10" />

          {/* Section Description et Exemples */}
          {subAction.referentiel === 'eci' &&
            (subAction.description || subAction.have_exemples) && (
              <Accordion
                id={`Description-${subAction.id}`}
                className="fr-mb-3w"
                titre="Description"
                html={<SubActionDescription subAction={subAction} />}
              />
            )}

          {/* Section Tâches */}
          {tasks.length > 0 && (
            <Accordion
              id={`Tâches-${subAction.id}`}
              dataTest={`TâchesPanel-${subAction.identifiant}`}
              className="fr-mb-3w"
              titre="Tâches"
              html={
                <SubActionTasksList
                  tasks={tasks}
                  actionScores={actionScores}
                  hideStatus={shouldHideTasksStatus}
                />
              }
              initialState={openTasks}
            />
          )}

          {/* Section Documents */}
          <SubActionPreuvesAccordion
            subAction={subAction}
            openSubAction={openSubAction}
          />
        </div>
      )}
    </div>
  );
};

export default SubActionCard;
