import { Button, useEventTracker } from '@/ui';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-provider';
import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { useFilteredIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import Module from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import ModalIndicateursSuiviPlan from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  TDBViewParam,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteTousLesIndicateursUrl,
  makeTableauBordModuleUrl,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { useRouter } from 'next/navigation';
import { getQueryKey } from '../usePersonalModulesFetch';

type Props = {
  view: TDBViewParam;
  module: ModuleIndicateursSelect;
};

const ModuleIndicateurs = ({ view, module }: Props) => {
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const { id: userId } = useUser();
  const router = useRouter();

  const trackEvent = useEventTracker('app/tdb/personnel');

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
      onSettingsClick={() =>
        trackEvent('tdb_modifier_filtres_indicateurs', {
          collectiviteId,
          niveauAcces,
          role,
        })
      }
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      footerButtons={
        <>
          <Button
            size="sm"
            onClick={() =>
              router.push(
                makeCollectiviteTousLesIndicateursUrl({
                  collectiviteId: collectiviteId!,
                })
              )
            }
          >
            Voir tous les indicateurs
          </Button>
          {data && data.length > 3 && (
            <Button
              variant="grey"
              size="sm"
              onClick={() =>
                router.push(
                  makeTableauBordModuleUrl({
                    collectiviteId: collectiviteId!,
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
                    collectiviteId: collectiviteId!,
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
