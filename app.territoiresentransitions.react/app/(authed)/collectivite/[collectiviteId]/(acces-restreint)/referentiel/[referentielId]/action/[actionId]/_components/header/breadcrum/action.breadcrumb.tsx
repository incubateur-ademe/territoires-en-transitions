import { uniq } from 'es-toolkit';
import { useState } from 'react';

import { useCollectiviteId } from '@/api/collectivites';
import { makeReferentielUrl } from '@/app/app/paths';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { Breadcrumbs } from '@/ui';
import { ReferentielDropdownNavigation } from './referentiel-dropdown.navigation';

/**
 * Fil d'ariane localisation d'une action dans le référentiel
 */
export const ActionBreadcrumb = ({ action }: { action: ActionDetailed }) => {
  const { actionId } = action;

  const collectiviteId = useCollectiviteId();

  const referentiel = useReferentielDownToAction(
    getReferentielIdFromActionId(actionId)
  );

  const getParent = (id: string) =>
    referentiel.find((e) => e.children.includes(id)) ?? null;

  const parents = uniq(
    referentiel.reduce((path) => {
      const parent = getParent(path[0]?.id ?? actionId);
      return parent ? [parent, ...path] : path;
    }, [] as ActionDefinitionSummary[])
  );

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <Breadcrumbs
        size="sm"
        items={parents.map((parent) => {
          if (parent.type === 'referentiel') {
            return {
              label: parent.nom,
              href: makeReferentielUrl({
                collectiviteId,
                referentielId: getReferentielIdFromActionId(actionId),
              }),
            };
          } else {
            return {
              label: `${parent.identifiant} - ${parent.nom}`,
              onClick: () => setIsOpen(true),
            };
          }
        })}
      />
      <ReferentielDropdownNavigation
        referentiel={referentiel}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        actionId={actionId}
        collectiviteId={collectiviteId}
      />
    </div>
  );
};
