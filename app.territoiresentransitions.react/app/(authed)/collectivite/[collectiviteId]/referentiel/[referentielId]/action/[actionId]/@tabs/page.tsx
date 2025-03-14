'use client';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import SubActionCard from '@/app/referentiels/actions/sub-action/sub-action.card';
import { useSortedActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Button } from '@/ui';
import { useState } from 'react';

export default function Page() {
  const action = DEPRECATED_useActionDefinition();

  if (!action) {
    return null;
  }

  return <ActionDetailPage action={action} />;
}

/**
 * Contenu de l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */
function ActionDetailPage({ action }: { action: ActionDefinitionSummary }) {
  const subActions = useSortedActionSummaryChildren(action);

  // Etat du bouton "Tout déplier" / "Tout replier"
  const [openAll, setOpenAll] = useState(false);

  // Nombre de sous-actions dépliées
  const [openedSubActionsCount, setOpenedSubActionsCount] = useState(
    openAll ? subActions.count : 0
  );

  // Click sur le bouton "Tout déplier" / "Tout replier"
  const toggleOpenAll = () => {
    setOpenedSubActionsCount(openAll ? 0 : subActions.count);
    setOpenAll((prevState) => !prevState);
  };

  // Mise à jour après l'ouverture / fermeture manuelle d'une sous-action
  const updateOpenedSubActionsCount = (isOpen: boolean) => {
    if (openedSubActionsCount === 1 && !isOpen) {
      setOpenAll(false);
    } else if (openedSubActionsCount === subActions.count - 1 && isOpen) {
      setOpenAll(true);
    }
    if (isOpen) setOpenedSubActionsCount((prevState) => prevState + 1);
    else setOpenedSubActionsCount((prevState) => prevState - 1);
  };

  return (
    <section>
      {/* Commentaire associé à l'action */}
      <ActionCommentaire action={action} className="mb-10" />

      {/* Bouton pour déplier / replier la liste */}
      <Button
        className="mb-10"
        variant="underlined"
        icon={openAll ? 'arrow-up-line' : 'arrow-down-line'}
        iconPosition="right"
        onClick={toggleOpenAll}
      >
        {openAll ? 'Tout replier' : 'Tout déplier'}
      </Button>

      {/* Sous-actions triées par phase */}
      <div className="flex flex-col gap-10">
        {['bases', 'mise en œuvre', 'effets'].map(
          (phase) =>
            subActions.sortedActions[phase] && (
              <div key={phase} className="flex flex-col gap-8">
                <p className="mb-0 font-bold">
                  {phaseToLabel[phase].toUpperCase()}
                </p>
                {subActions.sortedActions[phase].map((subAction) => (
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
}
