import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useSortedActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useState} from 'react';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import ExpendAllButton from 'ui/buttons/ExpendAllButton';
import SubActionCard from './SubActionCard';

type ActionFollowUpProps = {
  action: ActionDefinitionSummary;
};

/**
 * Contenu de l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */

const ActionFollowUp = ({action}: ActionFollowUpProps): JSX.Element => {
  const subActions = useSortedActionSummaryChildren(action);

  // Etat du bouton "Tout déplier" / "Tout replier"
  const [openAll, setOpenAll] = useState(false);

  // Nombre de sous-actions dépliées
  const [openedSubActionsCount, setOpenedSubActionsCount] = useState(
    openAll ? subActions.count : 0
  );

  // Phases des sous-actions
  const phaseToTitle: Record<string, string> = {
    bases: "S'engager",
    'mise en œuvre': 'Concrétiser',
    effets: 'Consolider',
  };

  // Click sur le bouton "Tout déplier" / "Tout replier"
  const toggleOpenAll = () => {
    setOpenedSubActionsCount(openAll ? 0 : subActions.count);
    setOpenAll(prevState => !prevState);
  };

  // Mise à jour après l'ouverture / fermeture manuelle d'une sous-action
  const updateOpenedSubActionsCount = (isOpen: boolean) => {
    if (openedSubActionsCount === 1 && !isOpen) {
      setOpenAll(false);
    } else if (openedSubActionsCount === subActions.count - 1 && isOpen) {
      setOpenAll(true);
    }
    if (isOpen) setOpenedSubActionsCount(prevState => prevState + 1);
    else setOpenedSubActionsCount(prevState => prevState - 1);
  };

  return (
    <section>
      {/* Commentaire associé à l'action */}
      <ActionCommentaire action={action} className="mb-10" />

      {/* Bouton pour déplier / replier la liste */}
      <ExpendAllButton
        open={openAll}
        onToggleOpen={toggleOpenAll}
        className="mb-10"
      />

      {/* Sous-actions triées par phase */}
      <div className="flex flex-col gap-10">
        {['bases', 'mise en œuvre', 'effets'].map(
          phase =>
            subActions.sortedActions[phase] && (
              <div key={phase} className="flex flex-col gap-8">
                <p className="mb-0 font-bold">
                  {phaseToTitle[phase].toUpperCase()}
                </p>
                {subActions.sortedActions[phase].map(subAction => (
                  <SubActionCard
                    key={subAction.id}
                    subAction={subAction}
                    forceOpen={openAll}
                    onOpenSubAction={updateOpenedSubActionsCount}
                  />
                ))}
              </div>
            )
        )}
      </div>
    </section>
  );
};

export default ActionFollowUp;
