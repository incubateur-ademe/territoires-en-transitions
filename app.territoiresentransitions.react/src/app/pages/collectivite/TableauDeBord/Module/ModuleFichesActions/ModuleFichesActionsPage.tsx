import {
  ModuleFicheActionsSelect,
  Slug,
} from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { Button, TrackPageView, useEventTracker } from '@tet/ui';

import { TDBViewParam } from 'app/paths';
import ModalActionsDontJeSuisLePilote from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import ModalActionsRecemmentModifiees from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsRecemmentModifiees';
import {
  getQueryKey,
  usePersonalModuleFetch,
} from 'app/pages/collectivite/TableauDeBord/Module/usePersonalModuleFetch';
import { useCollectiviteId } from 'core-logic/hooks/params';
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
const ModuleFichesActionsPage = ({ view, slug, sortSettings }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: dataModule, isLoading: isModuleLoading } =
    usePersonalModuleFetch(slug);
  const module = dataModule as ModuleFicheActionsSelect;

  const trackEvent = useEventTracker(`app/tdb/personnel/${slug}`);

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/personnel/${slug}`}
        properties={{ collectivite_id: collectiviteId! }}
      />
      <FichesActionListe
        filtres={module.options.filtre}
        sortSettings={sortSettings}
        settings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                trackEvent(
                  (slug === 'actions-dont-je-suis-pilote'
                    ? 'tdb_modifier_filtres_actions_pilotes'
                    : 'tdb_modifier_filtres_actions_modifiees') as never,
                  { collectivite_id: collectiviteId } as never
                );
              }}
            />
            {module.slug === 'actions-dont-je-suis-pilote' &&
              openState.isOpen && (
                <ModalActionsDontJeSuisLePilote
                  openState={openState}
                  module={module as ModuleFicheActionsSelect}
                  keysToInvalidate={[getQueryKey(slug)]}
                />
              )}
            {module.slug === 'actions-recemment-modifiees' &&
              openState.isOpen && (
                <ModalActionsRecemmentModifiees
                  openState={openState}
                  module={module as ModuleFicheActionsSelect}
                  keysToInvalidate={[getQueryKey(slug)]}
                />
              )}
          </>
        )}
      />
    </ModulePage>
  );
};

export default ModuleFichesActionsPage;
