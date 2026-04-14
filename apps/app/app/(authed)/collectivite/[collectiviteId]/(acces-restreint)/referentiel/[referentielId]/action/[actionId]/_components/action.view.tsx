'use client';

import {
  DEPRECATED_useActionDefinition,
  useAction,
} from '@/app/referentiels/actions/action-context';
import { ActionPersonnalisationInfo } from '@/app/referentiels/actions/action-personnalisations/ActionPersonnalisationInfo';
  DiscussionListItem,
  useListDiscussions,
} from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { StickyHeaderHeightProvider } from '@/app/ui/layout/HeaderSticky';
import { Discussion } from '@tet/domain/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Spacer } from '@tet/ui';
import { ActionJustificationField } from './action/action.justification-field';
import { useDisplaySettings } from './display-settings.context';
import { ActionHeader } from './header/action.header';
import { SubActionCardsList } from './subaction/subaction.cards-list';

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
        <ActionHeader action={action} actionComments={data.discussions} />
        <Spacer height={2} />
        <div className="grow flex flex-col">
          <ActionDetailContent
            action={action}
            actionComments={data.discussions}
          />
        </div>
        <Spacer height={2} />
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
  actionComments,
}: {
  action: ActionListItem;
  actionComments: DiscussionListItem[];
}) {
  const sousActions = useGetActionChildren({ actionId: action.actionId });

  const sousActionsGroupedByCategorie = groupByCategorie(sousActions);

  const { showJustifications, actionsAreAllExpanded } = useDisplaySettings();

  return (
    <section>
      <div className="flex flex-col">
        <ActionPersonnalisationInfo className="mb-2" actionId={action.id} />
        <ActionAuditDetail action={action} />
        {showJustifications && (
          <>
            <Spacer height={1} />
            <div className=" bg-white p-4 rounded-lg">
              <ActionJustificationField
                action={action}
                title="Explications sur l'état d'avancement :"
                className="min-h-20"
              />
            </div>
          </>
        )}
        <Spacer height={1} />
      </div>

      {sousActions.length > 0 && (
        <SubActionCardsList
          parentAction={action}
          sortedSubActions={sousActionsGroupedByCategorie}
          showJustifications={showJustifications}
          actionsAreAllExpanded={actionsAreAllExpanded}
          discussions={actionComments}
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
