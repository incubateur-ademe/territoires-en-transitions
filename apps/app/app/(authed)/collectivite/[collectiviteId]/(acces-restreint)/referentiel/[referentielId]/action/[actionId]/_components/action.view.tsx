'use client';

import { ActionPersonnalisationInfo } from '@/app/referentiels/actions/action-personnalisations/ActionPersonnalisationInfo';
import {
  DiscussionListItem,
  useListDiscussions,
} from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { StickyHeaderHeightProvider } from '@/app/ui/layout/HeaderSticky';

import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { ActionExplicationField } from './action-explication.field';
import { SubactionsListContainer } from './components.new-referentiel/subactions.list-container';
import { SubActionCardsList } from './components.old-referentiel/subaction/subaction.cards-list';
import { useDisplaySettings } from './display-settings.context';
import { ActionHeader } from './header/action.header';

export const ActionView = ({ action }: { action: ActionListItem }) => {
  const referentielId = getReferentielIdFromActionId(action.actionId);

  const { data = { discussions: [] } } = useListDiscussions(referentielId, {
    actionId: action.actionId,
  });

  return (
    <StickyHeaderHeightProvider>
      <div
        data-test={`Action-${action.identifiant}`}
        className="grow flex flex-col"
      >
        <ActionHeader action={action} />
        <ActionDetailContent
          action={action}
          discussions={data.discussions}
          referentielId={referentielId}
        />
        <ScrollTopButton />
      </div>
    </StickyHeaderHeightProvider>
  );
};

/**
 * Contenu de l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "État des lieux"
 */
function ActionDetailContent({
  action,
  discussions,
  referentielId,
}: {
  referentielId: ReferentielId;
  action: ActionListItem;
  discussions: DiscussionListItem[];
}) {
  const sousActions = useGetActionChildren({ actionId: action.actionId });

  const sousActionsGroupedByCategorie = groupByCategorie(sousActions);

  const { actionsAreAllExpanded } = useDisplaySettings();

  const isOldReferentiel = referentielId === 'eci' || referentielId === 'cae';

  const isNewReferentiel = !isOldReferentiel;

  return (
    <section className="grow my-8">
      <div className="flex flex-col gap-6 mb-8">
        <ActionPersonnalisationInfo actionId={action.actionId} />
        <ActionAuditDetail action={action} />
        {action.childrenIds.length !== 1 && (
          <div className=" bg-white p-4 rounded-lg">
            <ActionExplicationField
              action={action}
              title="Explications sur l'état d'avancement :"
            />
          </div>
        )}
      </div>

      {isNewReferentiel && (
        <SubactionsListContainer
          subActionsByCategories={sousActionsGroupedByCategorie}
          discussions={discussions}
        />
      )}

      {isOldReferentiel && (
        <SubActionCardsList
          parentAction={action}
          sortedSubActions={sousActionsGroupedByCategorie}
          actionsAreAllExpanded={actionsAreAllExpanded}
          discussions={discussions}
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
