import { makeReferentielUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { Breadcrumbs } from '@/ui';
import { uniq } from 'es-toolkit';

/**
 * The nav bar at the top of an orientation page, made of several
 * OrientationSwitcher
 */
export const ActionBreadcrumb = (props: {
  action: ActionDefinitionSummary;
}) => {
  const { action } = props;
  const collectiviteId = useCollectiviteId();

  const referentiel = useReferentielDownToAction(action.referentiel);

  const getParent = (id: string) =>
    referentiel.find((e) => e.children.includes(id)) ?? null;

  const parents = uniq(
    referentiel.reduce((path) => {
      const parent = getParent(path[0]?.id ?? action.id);
      return parent ? [parent, ...path] : path;
    }, [] as ActionDefinitionSummary[])
  );

  return (
    <Breadcrumbs
      size="sm"
      className="py-2 border-y border-grey-3"
      items={parents.map((parent) => {
        if (parent.type === 'referentiel') {
          return {
            label: parent.nom,
            href: makeReferentielUrl({
              collectiviteId,
              referentielId: getReferentielIdFromActionId(action.id),
            }),
          };
        } else {
          return {
            label: `${parent.identifiant} - ${parent.nom}`,
          };
        }
      })}
    />
  );
};
