'use client';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import { useSortedActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { Checkbox, Divider } from '@/ui';
import ActionJustificationField from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import SubActionCardsList from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.cards-list';
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

  const [showJustifications, setShowJustififcations] = useState(true);

  return (
    <section>
      {/* En-tête de la section */}
      <div className="flex flex-col">
        <div className="flex gap-4">
          {/* Nombre de mesures affichées */}
          <span className="text-grey-6 text-base font-medium">
            {subActions.count} {subActions.count > 1 ? 'mesures' : 'mesure'}
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
          actionName={`${action.identifiant} ${action.nom}`}
          sortedSubActions={subActions.sortedActions}
          subActionsList={subActions.actions}
          showJustifications={showJustifications}
        />
      )}
    </section>
  );
}
