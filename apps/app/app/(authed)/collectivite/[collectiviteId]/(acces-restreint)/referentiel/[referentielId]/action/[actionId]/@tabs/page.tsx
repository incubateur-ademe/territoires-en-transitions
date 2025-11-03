'use client';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import { useSortedActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { Button, Checkbox, Divider } from '@/ui';
import { useState } from 'react';
import { ActionJustificationField } from '../../../../../../../../../../src/referentiels/[referentielId]/action/[actionId]/components/action/action.justification-field';
import { SubActionCardsList } from '../../../../../../../../../../src/referentiels/[referentielId]/action/[actionId]/components/subaction/subaction.cards-list';

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

  const [showJustifications, setShowJustififcations] = useState(true);

  const [subActionsExpanded, setSubActionsExpanded] = useState(false);

  return (
    <section>
      {/* En-tête de la section */}
      <div className="flex flex-col">
        <div className="flex gap-4">
          <Button
            variant="underlined"
            icon={subActionsExpanded ? 'arrow-up-line' : 'arrow-down-line'}
            iconPosition="right"
            onClick={() => setSubActionsExpanded(!subActionsExpanded)}
          >
            {subActionsExpanded ? 'Tout replier' : 'Tout déplier'}
          </Button>
          {/* Nombre de mesures affichées */}
          <span className="text-grey-6 text-base font-medium">
            {subActions.count}{' '}
            {subActions.count > 1 ? 'sous-mesures' : 'sous-mesure'}
          </span>

          {/* Affichage des justifications */}
          <Checkbox
            variant="switch"
            label="Afficher l’état d’avancement"
            labelClassname="text-grey-7"
            checked={showJustifications}
            onChange={(evt) =>
              setShowJustififcations(evt.currentTarget.checked)
            }
          />
        </div>

        <Divider color="grey" className="mt-6" />

        {/* Explications sur l'état d'avancement */}
        {showJustifications && (
          <ActionJustificationField
            actionId={action.id}
            title="Explications sur l'état d'avancement :"
            className="min-h-20"
            fieldClassName="mb-5"
          />
        )}
      </div>

      {/* Sous-actions triées par phase */}
      {subActions.actions.length > 0 && (
        <SubActionCardsList
          sortedSubActions={subActions.sortedActions}
          subActionsList={subActions.actions}
          showJustifications={showJustifications}
          isSubActionExpanded={subActionsExpanded}
        />
      )}
    </section>
  );
}
