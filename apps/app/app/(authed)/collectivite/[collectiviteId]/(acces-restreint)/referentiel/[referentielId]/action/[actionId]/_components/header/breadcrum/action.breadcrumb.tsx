import { useState } from 'react';

import { makeReferentielUrl } from '@/app/app/paths';
import { useGetActionAncestors } from '@/app/referentiels/actions/use-get-action-ancestors';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useListActionsGroupedById } from '@/app/referentiels/actions/use-list-actions-grouped-by-id';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { Breadcrumbs } from '@tet/ui';
import { ReferentielDropdownNavigation } from './referentiel-dropdown.navigation';

/**
 * Fil d'ariane localisation d'une action dans le référentiel
 */
export const ActionBreadcrumb = ({ action }: { action: ActionListItem }) => {
  const { actionId } = action;

  const collectiviteId = useCollectiviteId();
  const [{ data: actions = {} }] = useListActionsGroupedById({
    referentielIds: [getReferentielIdFromActionId(actionId)],
  });
  const ancestors = useGetActionAncestors({ actionId }) ?? [];

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <Breadcrumbs
        size="sm"
        enableLastElementClick
        items={ancestors.map((parent, index) => {
          if (parent.actionType === ActionTypeEnum.REFERENTIEL) {
            return {
              label: parent.nom,
              href: makeReferentielUrl({
                collectiviteId,
                referentielId: getReferentielIdFromActionId(actionId),
              }),
            };
          } else if (index === 1) {
            return {
              label: `${parent.identifiant} - ${parent.nom}`,
              onClick: () => setIsOpen(true),
            };
          } else {
            return {
              label: `${parent.identifiant} - ${parent.nom}`,
            };
          }
        })}
      />

      <ReferentielDropdownNavigation
        actions={actions}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        actionId={actionId}
        collectiviteId={collectiviteId}
      />
    </div>
  );
};
