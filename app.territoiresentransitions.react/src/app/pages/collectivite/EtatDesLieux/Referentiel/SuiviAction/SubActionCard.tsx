import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
// import {useActionStatut} from 'core-logic/hooks/useActionStatut';
// import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {Fragment, useEffect, useState} from 'react';
import {Accordion} from 'ui/Accordion';
import {Spacer} from 'ui/dividers/Spacer';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {ActionPreuvePanel} from 'ui/shared/actions/ActionPreuvePanel';
import {useActionPreuvesCount} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import SubActionDescription from './SubActionDescription';
import SubActionHeader from './SubActionHeader';
import SubActionTasksList from './SubActionTasksList';

type SubActionCardProps = {
  subAction: ActionDefinitionSummary;
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
  forceOpen,
  onOpenSubAction,
}: SubActionCardProps): JSX.Element => {
  // const collectivite = useCurrentCollectivite();
  // const {statut} = useActionStatut({
  //   action_id: subAction.id,
  //   collectivite_id: collectivite?.collectivite_id || 0,
  // });
  const preuvesCount = useActionPreuvesCount(subAction);
  const tasks = useActionSummaryChildren(subAction);
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
        openSubAction={openSubAction}
        withStatusDropdown={tasks.length === 0}
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
              <Fragment>
                <Accordion
                  id={`Description-${subAction.id}`}
                  titre="Description"
                  html={<SubActionDescription subAction={subAction} />}
                />
                <Spacer size={3} />
              </Fragment>
            )}

          {/* Section Tâches */}
          {tasks.length > 0 && (
            <Fragment>
              <Accordion
                id={`Tâches-${subAction.id}`}
                dataTest={`TâchesPanel-${subAction.identifiant}`}
                titre="Tâches"
                html={<SubActionTasksList tasks={tasks} />}
                initialState={openTasks}
              />
              <Spacer size={3} />
            </Fragment>
          )}

          {/* Section Documents */}
          <Accordion
            id={`Preuves-${subAction.id}`}
            dataTest={`PreuvesPanel-${subAction.identifiant}`}
            titre={`Documents${
              preuvesCount !== undefined ? ` (${preuvesCount})` : ''
            }`}
            html={<ActionPreuvePanel action={subAction} showWarning />}
            initialState={openSubAction && (preuvesCount ?? 0) > 0}
          />
        </div>
      )}
    </div>
  );
};

export default SubActionCard;
