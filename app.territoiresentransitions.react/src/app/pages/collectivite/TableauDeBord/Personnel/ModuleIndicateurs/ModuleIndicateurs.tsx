import { Button, Event, useEventTracker } from '@/ui';

import { useCollectiviteId } from '@/api/collectivites';
import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-provider';
import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { useFilteredIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import Module from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import ModalIndicateursSuiviPlan from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  TDBViewParam,
  makeCollectiviteIndicateursCollectiviteUrl,
  makeCollectiviteIndicateursUrl,
  makeTableauBordModuleUrl,
} from '@/app/app/paths';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { useRouter } from 'next/navigation';
import { getQueryKey } from '../usePersonalModulesFetch';

type Props = {
  view: TDBViewParam;
  module: ModuleIndicateursSelect;
};

const ModuleIndicateurs = ({ view, module }: Props) => {
  const collectiviteId = useCollectiviteId();
  const { id: userId } = useUser();
  const router = useRouter();

  const trackEvent = useEventTracker();

  const { data, isLoading } = useFilteredIndicateurDefinitions(
    { ...module.options, sort: [{ field: 'estComplet', direction: 'desc' }] },
    false
  );

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoIndicateurVide className="w-16 h-16" />}
      editModal={(openState) => (
        <ModalIndicateursSuiviPlan
          openState={openState}
          module={module}
          keysToInvalidate={[getQueryKey(collectiviteId, userId)]}
        />
      )}
      onSettingsClick={() => trackEvent(Event.tdb.updateFiltresIndicateurs)}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      footerButtons={
        <>
          <Button
            variant="grey"
            size="sm"
            onClick={() =>
              router.push(
                makeCollectiviteIndicateursCollectiviteUrl({ collectiviteId })
              )
            }
          >
            Voir les indicateurs de la collectivité
          </Button>
          {data && data.length > 3 && (
            <Button
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
              {data.length === 4
                ? '1 autre indicateur'
                : `les ${data.length - 3} autres indicateurs`}
            </Button>
          )}
        </>
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {data &&
          data.map(
            (definition, index) =>
              index < 3 && (
                <IndicateurCard
                  key={definition.id}
                  definition={definition}
                  href={makeCollectiviteIndicateursUrl({
                    collectiviteId,
                    indicateurView: getIndicateurGroup(definition.identifiant),
                    indicateurId: definition.id,
                    identifiantReferentiel: definition.identifiant,
                  })}
                  card={{ external: true }}
                />
              )
          )}
      </div>
    </Module>
  );
};

export default ModuleIndicateurs;
