import { Button, TrackPageView, useEventTracker } from '@tet/ui';

import {
  ModuleIndicateursSelect,
  Slug,
} from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';
import ModalIndicateursSuiviPlan from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  getQueryKey,
  useModuleFetch,
} from 'app/pages/collectivite/TableauDeBord/Module/useModuleFetch';
import { TDBViewParam } from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import ModulePage from '../ModulePage';

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

const ModuleIndicateursPage = ({ view, slug }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: module, isLoading: isModuleLoading } = useModuleFetch(slug);

  const filtre = module?.options.filtre;

  const trackEvent = useEventTracker(
    `app/tdb/personnel/indicateurs-de-suivi-de-mes-plans`
  );

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/personnel/${slug}`}
        properties={{ collectivite_id: collectiviteId! }}
      />
      <IndicateursListe
        filtres={filtre}
        settings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                trackEvent('tdb_modifier_filtres_indicateurs', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            {openState.isOpen && (
              <ModalIndicateursSuiviPlan
                openState={openState}
                module={module as ModuleIndicateursSelect}
                keysToInvalidate={[getQueryKey(slug)]}
              />
            )}
          </>
        )}
      />
    </ModulePage>
  );
};

export default ModuleIndicateursPage;
