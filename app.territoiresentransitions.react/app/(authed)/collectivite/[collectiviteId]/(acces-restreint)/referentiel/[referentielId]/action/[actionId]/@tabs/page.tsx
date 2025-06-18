'use client';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import SubActionCard from '@/app/referentiels/actions/sub-action/sub-action.card';
import { useSortedActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Divider } from '@/ui';

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

  return (
    <section>
      {/* En-tête de la section */}
      <div className="flex flex-col">
        {/* Nombre de mesures affichées */}
        <span className="text-grey-6 text-base font-medium">
          {subActions.count} {subActions.count > 1 ? 'mesures' : 'mesure'}
        </span>

        <Divider color="grey" className="mt-6" />

        {/* Explications sur l'état d'avancement */}
        <ActionCommentaire action={action} className="mb-5" />
      </div>

      {/* Sous-actions triées par phase */}
      <div className="flex flex-col gap-7">
        {['bases', 'mise en œuvre', 'effets'].map(
          (phase) =>
            subActions.sortedActions[phase] && (
              <div key={phase} className="flex flex-col">
                <h6 className="mb-0 text-sm">
                  {phaseToLabel[phase].toUpperCase()}
                </h6>
                <Divider color="light" className="mt-2" />

                <div className="flex flex-col gap-7">
                  {subActions.sortedActions[phase].map((subAction) => (
                    <SubActionCard key={subAction.id} subAction={subAction} />
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </section>
  );
}
