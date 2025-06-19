'use client';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import { useSortedActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { Divider } from '@/ui';
import ActionField from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.field';
import SubActionsList from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.list';

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
        <ActionField
          actionId={action.id}
          title="Explications sur l'état d'avancement :"
          className="min-h-20"
          fieldClassName="mb-5"
        />
      </div>

      {/* Sous-actions triées par phase */}
      {subActions.actions.length > 0 && (
        <SubActionsList
          actionName={`${action.identifiant} ${action.nom}`}
          sortedSubActions={subActions.sortedActions}
          subActionsList={subActions.actions}
        />
      )}
    </section>
  );
}
