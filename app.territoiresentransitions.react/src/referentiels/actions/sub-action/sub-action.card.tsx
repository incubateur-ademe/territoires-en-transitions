import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { Accordion } from '@/app/ui/Accordion';
import { useEffect, useRef } from 'react';
import SubActionTasksList from '../sub-action-task/sub-action-task.list';
import SubActionPreuvesAccordion from './sub-action-preuves.accordion';
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
};

/**
 * Carte permettant l'affichage d'une sous-action
 * dans l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */

const SubActionCard = ({ subAction }: SubActionCardProps): JSX.Element => {
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

  useEffect(() => {
    const id = hash.slice(1); // enlève le "#" au début du hash

    if (id.includes(subAction.id)) {
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

  return (
    <div
      ref={ref}
      data-test={`SousAction-${subAction.identifiant}`}
      className="border border-[#e5e5e5] rounded-lg"
    >
      {/* En-tête */}
      <SubActionHeader
        actionDefinition={subAction}
        displayProgressBar={shouldDisplayProgressBar}
      />

      {/* Contenu */}
      <div className="p-6">
        {/* Commentaire associé à la sous-action */}
        <ActionCommentaire action={subAction} className="mb-10" />

        {/* Section Description et Exemples */}
        {subAction.referentiel === 'eci' &&
          (subAction.description || subAction.haveExemples) && (
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
                className="mt-2"
                tasks={tasks}
                hideStatus={
                  shouldHideTasksStatus ||
                  (statut !== null && statut?.avancement === 'detaille')
                }
              />
            }
          />
        )}

        {/* Section Documents */}
        <SubActionPreuvesAccordion subAction={subAction} />
      </div>
    </div>
  );
};

export default SubActionCard;
