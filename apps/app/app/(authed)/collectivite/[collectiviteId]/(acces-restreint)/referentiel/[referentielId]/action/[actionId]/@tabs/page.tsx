'use client';

import { useAction } from '@/app/referentiels/actions/action-context';
import { useListDiscussions } from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Checkbox, Divider } from '@tet/ui';
import { useState } from 'react';
import { ActionJustificationField } from '../_components/action/action.justification-field';
import { SubActionCardsList } from '../_components/subaction/subaction.cards-list';

export default function Page() {
  const action = useAction();

  if (!action) {
    return null;
  }

  return <ActionDetailPage action={action} />;
}

/**
 * Contenu de l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */
function ActionDetailPage({ action }: { action: ActionListItem }) {
  const sousActions = useGetActionChildren({ actionId: action.actionId });

  const referentielId = getReferentielIdFromActionId(action.actionId);
  const { data: discussions } = useListDiscussions(referentielId, {
    actionId: action.actionId,
  });

  const sousActionsGroupedByCategorie = groupByCategorie(sousActions);

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
            {sousActions.length}{' '}
            {sousActions.length > 1 ? 'sous-mesures' : 'sous-mesure'}
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

        <Divider className="my-6" />

        {/* Explications sur l'état d'avancement */}
        {showJustifications && (
          <ActionJustificationField
            actionId={action.actionId}
            title="Explications sur l'état d'avancement :"
            className="min-h-20"
            fieldClassName="mb-5"
          />
        )}
      </div>

      {/* Sous-actions triées par phase */}
      {sousActions.length > 0 && (
        <SubActionCardsList
          parentAction={action}
          sortedSubActions={sousActionsGroupedByCategorie}
          showJustifications={showJustifications}
          isSubActionExpanded={subActionsExpanded}
          discussions={
            discussions?.discussions.filter(
              (discussion) => discussion.actionId === action.actionId
            ) ?? []
          }
        />
      )}
    </section>
  );
}

function groupByCategorie<T extends { categorie: string | null }>(
  actions: T[]
) {
  let groupedActions: {
    [id: string]: T[];
  } = {};

  actions.forEach((act) => {
    if (act.categorie) {
      if (groupedActions[act.categorie]) {
        groupedActions[act.categorie].push(act);
      } else {
        groupedActions = {
          ...groupedActions,
          [act.categorie]: [act],
        };
      }
    }
  });

  return groupedActions;
}
