import {TCycleLabellisationStatus} from 'app/pages/collectivite/ParcoursLabellisation/useCycleLabellisation';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useActionStatut} from 'core-logic/hooks/useActionStatut';
import {useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
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
  auditStatus: TCycleLabellisationStatus;
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
  auditStatus,
  forceOpen,
  onOpenSubAction,
}: SubActionCardProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);

  const {hash} = useLocation();
  const {statut, filled} = useActionStatut(subAction.id);
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

  // Déplie les tâches si
  // - référentiel ECI
  // - référentiel CAE et sous-action au statut "détaillé"
  // - hash contenu dans l'url pointe vers une tâche de la sous-action
  const shouldOpen =
    subAction.referentiel === 'eci' ||
    (subAction.referentiel === 'cae' &&
      (avancement === 'detaille' ||
        (avancement === 'non_renseigne' && filled === true) ||
        (statut === null && filled === true))) ||
    (hash.slice(1).includes(subAction.id) && hash.slice(1) !== subAction.id);

  const [openTasks, setOpenTasks] = useState(false);
  const [openSubAction, setOpenSubAction] = useState(forceOpen);

  // Mise à jour de l'ouverture / fermeture de la sous-action
  // en fonction du bouton "Tout déplier" / "Tout replier"
  useEffect(() => setOpenSubAction(forceOpen), [forceOpen]);

  // Mise à jour de l'ouverture / fermeture de la liste des tâches
  useEffect(() => {
    setOpenTasks(openSubAction ? shouldOpen : false);
  }, [openSubAction]);

  useEffect(() => {
    const id = hash.slice(1); // enlève le "#" au début du hash

    if (id.includes(subAction.id)) {
      // Ouvre la sous-action indiquée dans l'url
      setOpenSubAction(true);

      // Scroll jusqu'à la sous-action indiquée dans l'url
      if (id === subAction.id && ref && ref.current) {
        setTimeout(() => {
          ref.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }, 0);
      }
    }
  }, [hash, ref]);

  const handleToggleOpen = () => {
    onOpenSubAction(!openSubAction);
    setOpenSubAction(prevState => !prevState);
  };

  return (
    <div
      ref={ref}
      data-test={`SousAction-${subAction.identifiant}`}
      className="border border-[#e5e5e5] rounded-lg"
    >
      {/* En-tête */}
      <SubActionHeader
        action={subAction}
        actionScores={actionScores}
        displayProgressBar={shouldDisplayProgressBar}
        displayActionCommentaire={
          auditStatus === 'audit_en_cours' && !openSubAction
        }
        openSubAction={openSubAction}
        onToggleOpen={handleToggleOpen}
      />

      {/* Contenu */}
      {openSubAction && (
        <div className="p-6">
          {/* Commentaire associé à la sous-action */}
          {(auditStatus !== 'audit_en_cours' || openSubAction) && (
            <ActionCommentaire action={subAction} className="mb-10" />
          )}

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
