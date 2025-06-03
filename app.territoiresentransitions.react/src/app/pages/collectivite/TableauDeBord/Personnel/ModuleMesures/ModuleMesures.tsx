import { Button, Event, useEventTracker } from '@/ui';

import { useCollectiviteId } from '@/api/collectivites';
import { ModuleMesuresSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import Module from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import { TDBViewParam, makeTableauBordModuleUrl } from '@/app/app/paths';
import { ActionCard } from '@/app/referentiels/actions/action.card';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { useRouter } from 'next/navigation';

type Props = {
  view: TDBViewParam;
  module: ModuleMesuresSelect;
};

export function ModuleMesures({ view, module }: Props) {
  const collectiviteId = useCollectiviteId();

  const router = useRouter();

  const trackEvent = useEventTracker();

  const { data, isLoading } = useListActions(module.options.filtre);

  const totalCount = data?.length || 0;

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoIndicateurVide className="w-16 h-16" />}
      editModal={
        (openState) => null
        // <ModalFiltreMesures
        //   openState={openState}
        //   module={module}
        //   keysToInvalidate={[getQueryKey(collectiviteId, userId)]}
        // />
      }
      onSettingsClick={() => trackEvent(Event.tdb.updateFiltresIndicateurs)}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      footerButtons={
        totalCount > 4 && (
          <Button
            variant="grey"
            size="sm"
            onClick={() =>
              router.push(
                makeTableauBordModuleUrl({
                  collectiviteId,
                  view,
                  module: module.defaultKey,
                })
              )
            }
          >
            Afficher{' '}
            {totalCount === 5
              ? '1 autre mesure'
              : `les ${totalCount - 4} autres mesures`}
          </Button>
        )
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {data &&
          data.map(
            (definition, index) =>
              index < 3 && (
                <ActionCard key={definition.actionId} action={definition} />
              )
          )}
      </div>
    </Module>
  );
}
