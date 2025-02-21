import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { TCycleLabellisationStatus } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { Accordion } from '@/app/ui/Accordion';
import { useEffect, useRef, useState } from 'react';
import ActionJustification from './sub-action-justification';
import SubActionPreuvesAccordion from './sub-action-preuves.accordion';
import SubActionTasksList from './sub-action-task.list';
import SubActionDescription from './sub-action.description';
import SubActionHeader from './sub-action.header';

export const getHashFromUrl = () => {
  // Only run on client side since window is not available on server
  if (typeof window !== 'undefined') {
    // Get everything after # symbol, removing the # itself
    const hash = window.location.hash.slice(1);
    return hash;
  }

  return '';
};

type SubActionCardProps = {
  subAction: ActionDefinitionSummary;
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
  auditStatus,
  forceOpen,
  onOpenSubAction,
}: SubActionCardProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);

  const hash = getHashFromUrl();

  const { statut, filled } = useActionStatut(subAction.id);
  const { avancement, concerne } = statut || {};
  const tasks = useActionSummaryChildren(subAction);

  const shouldDisplayProgressBar =
    concerne !== false &&
    (avancement === 'detaille' ||
      (avancement === 'non_renseigne' && filled === true) ||
      (statut === null && filled === true));

  const shouldHideTasksStatus =
    (statut !== null &&
      statut?.avancement !== 'non_renseigne' &&
      statut?.avancement !== 'detaille') ||
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
    (hash.includes(subAction.id) && hash !== subAction.id);

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
    setOpenSubAction((prevState) => !prevState);
  };

  return (
    <div
      ref={ref}
      data-test={`SousAction-${subAction.identifiant}`}
      className="border border-[#e5e5e5] rounded-lg"
    >
      {/* En-tête */}
      <SubActionHeader
        actionDefinition={subAction}
        actionAvancement={avancement}
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
            <>
              <ActionCommentaire action={subAction} className="mb-10" />
              {subAction.referentiel === 'cae' &&
              avancement === 'detaille' &&
              subAction.children?.length ? (
                <ActionJustification
                  action={subAction}
                  className="mb-10"
                  title="Justification de l’ajustement manuel du score"
                />
              ) : null}
            </>
          )}

          {/* Section Description et Exemples */}
          {subAction.referentiel === 'eci' &&
            (subAction.description || subAction.have_exemples) && (
              <Accordion
                id={`Description-${subAction.id}`}
                className="mb-6"
                titre="Description"
                html={<SubActionDescription subAction={subAction} />}
              />
            )}

          {/* Section Tâches */}
          {tasks.length > 0 && (
            <Accordion
              id={`Tâches-${subAction.id}`}
              dataTest={`TâchesPanel-${subAction.identifiant}`}
              className="mb-6"
              titre="Tâches"
              html={
                <SubActionTasksList
                  tasks={tasks}
                  hideStatus={shouldHideTasksStatus}
                  statusWarningMessage={
                    statut !== null && statut?.avancement === 'detaille'
                  }
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
