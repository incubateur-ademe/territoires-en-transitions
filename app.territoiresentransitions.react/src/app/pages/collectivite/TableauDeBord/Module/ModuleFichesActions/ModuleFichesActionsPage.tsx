import {
  ModuleFicheActionsSelect,
  Slug,
} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {TrackPageView, useEventTracker} from '@tet/ui';

import {TDBViewParam} from 'app/paths';
import ModalActionsDontJeSuisLePilote from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import ModalActionsRecemmentModifiees from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsRecemmentModifiees';
import {
  getQueryKey,
  useModuleFetch,
} from 'app/pages/collectivite/TableauDeBord/Module/useModuleFetch';
import {useCollectiviteId} from 'core-logic/hooks/params';
import ModulePage from '../ModulePage';
import FichesActionListe, {
  SortFicheActionSettings,
} from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';

type Props = {
  view: TDBViewParam;
  slug: Slug;
  sortSettings?: SortFicheActionSettings;
};

/** Page d'un module du tableau de bord plans d'action */
const ModuleFichesActionsPage = ({view, slug, sortSettings}: Props) => {
  const collectiviteId = useCollectiviteId();

  const {data: dataModule, isLoading: isModuleLoading} = useModuleFetch(slug);
  const module = dataModule as ModuleFicheActionsSelect;

  const trackEvent = useEventTracker(`app/tdb/personnel/${slug}`);

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/personnel/${slug}`}
        properties={{collectivite_id: collectiviteId!}}
      />
      <FichesActionListe
        filtres={module.options.filtre}
        sortSettings={sortSettings}
        onSettingsClick={() => {
          trackEvent(
            (slug === 'actions-dont-je-suis-pilote'
              ? 'tdb_modifier_filtres_actions_pilotes'
              : 'tdb_modifier_filtres_actions_modifiees') as never,
            {collectivite_id: collectiviteId} as never
          );
        }}
        settingsModal={openState => {
          if (module.slug === 'actions-dont-je-suis-pilote') {
            return (
              <ModalActionsDontJeSuisLePilote
                openState={openState}
                module={module as ModuleFicheActionsSelect}
                keysToInvalidate={[getQueryKey(slug)]}
              />
            );
          }
          if (module.slug === 'actions-recemment-modifiees') {
            return (
              <ModalActionsRecemmentModifiees
                openState={openState}
                module={module as ModuleFicheActionsSelect}
                keysToInvalidate={[getQueryKey(slug)]}
              />
            );
          }
        }}
      />
    </ModulePage>
  );
};

export default ModuleFichesActionsPage;
