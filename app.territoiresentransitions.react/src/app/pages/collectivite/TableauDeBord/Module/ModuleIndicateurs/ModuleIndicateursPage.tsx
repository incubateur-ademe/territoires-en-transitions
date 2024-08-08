import {TrackPageView, useEventTracker} from '@tet/ui';

import {
  ModuleIndicateursSelect,
  Slug,
} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {Indicateurs} from '@tet/api';
import ModalIndicateursSuiviPlan from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  getQueryKey,
  useModuleFetch,
} from 'app/pages/collectivite/TableauDeBord/Module/useModuleFetch';
import {TDBViewParam} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import ModulePage from '../ModulePage';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

const ModuleIndicateursPage = ({view, slug}: Props) => {
  const collectiviteId = useCollectiviteId();

  const {data: module, isLoading: isModuleLoading} = useModuleFetch(slug);

  const filtre = module && Indicateurs.moduleOptionsToFilters(module.options);

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
        properties={{collectivite_id: collectiviteId!}}
      />
      <IndicateursListe
        filtres={filtre}
        onSettingsClick={() => {
          trackEvent('tdb_modifier_filtres_indicateurs', {
            collectivite_id: collectiviteId!,
          });
        }}
        settingsModal={openState => (
          <ModalIndicateursSuiviPlan
            openState={openState}
            module={module as ModuleIndicateursSelect}
            keysToInvalidate={[getQueryKey(slug)]}
          />
        )}
      />
    </ModulePage>
  );
};

export default ModuleIndicateursPage;
